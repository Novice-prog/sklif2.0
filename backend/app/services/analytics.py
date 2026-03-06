from __future__ import annotations

from collections import defaultdict
from math import exp, log, sqrt
from statistics import mean, median

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.clinical import ControlPoint, DiagnosisRecord, Disease, LabResult, MedicalCase
from app.schemas.clinical import (
    ComparativeAnalyticsItem,
    ComparativeAnalyticsRequest,
    GroupAnalyticsItem,
    GroupAnalyticsRequest,
    GroupFilter,
    StatisticalTest,
)


def _quantile(values: list[float], q: float) -> float:
    if not values:
        return 0.0
    sorted_values = sorted(values)
    pos = (len(sorted_values) - 1) * q
    base = int(pos)
    rest = pos - base
    if base + 1 < len(sorted_values):
        return sorted_values[base] + rest * (sorted_values[base + 1] - sorted_values[base])
    return sorted_values[base]


def _std_dev(values: list[float], value_mean: float) -> float:
    if not values:
        return 0.0
    variance = sum((value - value_mean) ** 2 for value in values) / len(values)
    return sqrt(variance)


def _normal_cdf(z: float) -> float:
    t = 1 / (1 + 0.2316419 * abs(z))
    d = 0.3989423 * exp(-(z * z) / 2)
    p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
    return 1 - p if z > 0 else p


def _beta_continued_fraction(a: float, b: float, x: float) -> float:
    max_iterations = 100
    epsilon = 1e-10

    qab = a + b
    qap = a + 1
    qam = a - 1
    c = 1.0
    d = 1 - qab * x / qap

    if abs(d) < epsilon:
        d = epsilon

    d = 1 / d
    h = d

    for m in range(1, max_iterations + 1):
        m2 = 2 * m
        aa = m * (b - m) * x / ((qam + m2) * (a + m2))
        d = 1 + aa * d
        if abs(d) < epsilon:
            d = epsilon
        c = 1 + aa / c
        if abs(c) < epsilon:
            c = epsilon
        d = 1 / d
        h *= d * c

        aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2))
        d = 1 + aa * d
        if abs(d) < epsilon:
            d = epsilon
        c = 1 + aa / c
        if abs(c) < epsilon:
            c = epsilon
        d = 1 / d
        delta = d * c
        h *= delta

        if abs(delta - 1) < epsilon:
            break

    return h


def _incomplete_beta(a: float, b: float, x: float) -> float:
    if x <= 0:
        return 0.0
    if x >= 1:
        return 1.0

    bt = exp(a * log(x) + b * log(1 - x))

    if x < (a + 1) / (a + b + 2):
        return bt * _beta_continued_fraction(a, b, x) / a

    return 1 - bt * _beta_continued_fraction(b, a, 1 - x) / b


def _t_distribution_cdf(t_value: float, df: float) -> float:
    x = df / (df + t_value * t_value)
    return 1 - 0.5 * _incomplete_beta(df / 2, 0.5, x)


def _mann_whitney_test(group1_values: list[float], group2_values: list[float]) -> tuple[float, float, str]:
    n1 = len(group1_values)
    n2 = len(group2_values)
    if n1 == 0 or n2 == 0:
        return 0.0, 1.0, 'U'

    combined = [(value, 1) for value in group1_values] + [(value, 2) for value in group2_values]
    combined.sort(key=lambda item: item[0])

    ranks: list[tuple[float, int, float]] = []
    i = 0
    while i < len(combined):
        j = i
        while j < len(combined) and combined[j][0] == combined[i][0]:
            j += 1
        avg_rank = (i + 1 + j) / 2
        for k in range(i, j):
            ranks.append((combined[k][0], combined[k][1], avg_rank))
        i = j

    r1 = sum(rank for _, group, rank in ranks if group == 1)
    u1 = n1 * n2 + (n1 * (n1 + 1)) / 2 - r1
    u2 = n1 * n2 - u1
    u = min(u1, u2)

    mean_u = (n1 * n2) / 2
    std_u = sqrt((n1 * n2 * (n1 + n2 + 1)) / 12)
    if std_u == 0:
        return float(u), 1.0, 'U'

    z = abs((u - mean_u) / std_u)
    p_value = 2 * (1 - _normal_cdf(z))
    return float(u), float(min(1.0, max(0.0, p_value))), 'U'


def _student_t_test(group1_values: list[float], group2_values: list[float]) -> tuple[float, float, str]:
    n1 = len(group1_values)
    n2 = len(group2_values)
    if n1 < 2 or n2 < 2:
        return 0.0, 1.0, 't'

    mean1 = sum(group1_values) / n1
    mean2 = sum(group2_values) / n2

    var1 = sum((value - mean1) ** 2 for value in group1_values) / (n1 - 1)
    var2 = sum((value - mean2) ** 2 for value in group2_values) / (n2 - 1)

    pooled_var = ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2)
    if pooled_var <= 0:
        return 0.0, 1.0, 't'

    denominator = sqrt(pooled_var * (1 / n1 + 1 / n2))
    if denominator == 0:
        return 0.0, 1.0, 't'

    t_value = (mean1 - mean2) / denominator
    df = n1 + n2 - 2
    p_value = 2 * (1 - _t_distribution_cdf(abs(t_value), df))
    return float(t_value), float(min(1.0, max(0.0, p_value))), 't'


def _welch_t_test(group1_values: list[float], group2_values: list[float]) -> tuple[float, float, str]:
    n1 = len(group1_values)
    n2 = len(group2_values)
    if n1 < 2 or n2 < 2:
        return 0.0, 1.0, 't'

    mean1 = sum(group1_values) / n1
    mean2 = sum(group2_values) / n2

    var1 = sum((value - mean1) ** 2 for value in group1_values) / (n1 - 1)
    var2 = sum((value - mean2) ** 2 for value in group2_values) / (n2 - 1)

    denominator = sqrt(var1 / n1 + var2 / n2)
    if denominator == 0:
        return 0.0, 1.0, 't'

    t_value = (mean1 - mean2) / denominator

    numerator_df = (var1 / n1 + var2 / n2) ** 2
    denominator_df = ((var1 / n1) ** 2) / (n1 - 1) + ((var2 / n2) ** 2) / (n2 - 1)
    if denominator_df == 0:
        return 0.0, 1.0, 't'

    df = numerator_df / denominator_df
    p_value = 2 * (1 - _t_distribution_cdf(abs(t_value), df))
    return float(t_value), float(min(1.0, max(0.0, p_value))), 't'


def _kolmogorov_smirnov_test(group1_values: list[float], group2_values: list[float]) -> tuple[float, float, str]:
    n1 = len(group1_values)
    n2 = len(group2_values)
    if n1 == 0 or n2 == 0:
        return 0.0, 1.0, 'D'

    sorted1 = sorted(group1_values)
    sorted2 = sorted(group2_values)
    all_values = sorted(set(sorted1 + sorted2))

    max_d = 0.0
    for value in all_values:
        cdf1 = sum(1 for x in sorted1 if x <= value) / n1
        cdf2 = sum(1 for x in sorted2 if x <= value) / n2
        max_d = max(max_d, abs(cdf1 - cdf2))

    en = sqrt((n1 * n2) / (n1 + n2))
    if en == 0:
        return 0.0, 1.0, 'D'

    lambda_value = (en + 0.12 + 0.11 / en) * max_d
    p_value = 0.0
    for i in range(1, 101):
        p_value += ((-1) ** (i - 1)) * exp(-2 * i * i * lambda_value * lambda_value)

    p_value = min(1.0, max(0.0, 2 * p_value))
    return float(max_d), float(p_value), 'D'


def _run_stat_test(test: StatisticalTest, group1_values: list[float], group2_values: list[float]) -> tuple[float, float, str]:
    if test == StatisticalTest.student_t:
        return _student_t_test(group1_values, group2_values)
    if test == StatisticalTest.welch_t:
        return _welch_t_test(group1_values, group2_values)
    if test == StatisticalTest.kolmogorov_smirnov:
        return _kolmogorov_smirnov_test(group1_values, group2_values)
    return _mann_whitney_test(group1_values, group2_values)


class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def group_analytics(self, payload: GroupAnalyticsRequest) -> list[GroupAnalyticsItem]:
        disease_ids = self._filter_disease_ids(payload.group_filter)
        if not disease_ids:
            return []

        cp_by_disease = self._control_points_by_disease(disease_ids)
        cp_ids = self._candidate_cp_ids(cp_by_disease, payload.cp_indices)
        values_by_key = self._lab_values_by_cp_and_indicator(payload.indicator_ids, cp_ids)

        result: list[GroupAnalyticsItem] = []
        for cp_index in payload.cp_indices:
            for indicator_id in payload.indicator_ids:
                values: list[float] = []
                for disease_id in disease_ids:
                    cps = cp_by_disease.get(disease_id, [])
                    if cp_index >= len(cps):
                        continue
                    cp = cps[cp_index]
                    value = values_by_key.get((cp.id, indicator_id))
                    if value is not None:
                        values.append(value)

                if not values:
                    continue

                value_mean = float(mean(values))
                result.append(
                    GroupAnalyticsItem(
                        indicator_id=indicator_id,
                        cp_index=cp_index,
                        sample_size=len(values),
                        mean=value_mean,
                        median=float(median(values)),
                        std_dev=float(_std_dev(values, value_mean)),
                        q25=float(_quantile(values, 0.25)),
                        q75=float(_quantile(values, 0.75)),
                        min=float(min(values)),
                        max=float(max(values)),
                    )
                )

        return result

    def comparative_analytics(self, payload: ComparativeAnalyticsRequest) -> list[ComparativeAnalyticsItem]:
        group1_ids = self._filter_disease_ids(payload.group1)
        group2_ids = self._filter_disease_ids(payload.group2)
        if not group1_ids or not group2_ids:
            return []

        cp_map = self._control_points_by_disease(group1_ids + group2_ids)
        cp_ids = self._candidate_cp_ids(cp_map, payload.cp_indices)
        values_by_key = self._lab_values_by_cp_and_indicator(payload.indicator_ids, cp_ids)

        result: list[ComparativeAnalyticsItem] = []
        for cp_index in payload.cp_indices:
            for indicator_id in payload.indicator_ids:
                g1 = self._collect_values(group1_ids, cp_map, values_by_key, cp_index, indicator_id)
                g2 = self._collect_values(group2_ids, cp_map, values_by_key, cp_index, indicator_id)

                if not g1 or not g2:
                    continue

                g1_mean = float(mean(g1))
                g2_mean = float(mean(g2))
                statistic, p_value, statistic_name = _run_stat_test(payload.statistical_test, g1, g2)
                result.append(
                    ComparativeAnalyticsItem(
                        indicator_id=indicator_id,
                        cp_index=cp_index,
                        group1_n=len(g1),
                        group2_n=len(g2),
                        group1_mean=g1_mean,
                        group2_mean=g2_mean,
                        group1_median=float(median(g1)),
                        group2_median=float(median(g2)),
                        group1_q25=float(_quantile(g1, 0.25)),
                        group2_q25=float(_quantile(g2, 0.25)),
                        group1_q75=float(_quantile(g1, 0.75)),
                        group2_q75=float(_quantile(g2, 0.75)),
                        mean_delta=g1_mean - g2_mean,
                        statistic=statistic,
                        statistic_name=statistic_name,
                        p_value=p_value,
                        is_significant=p_value < payload.significance_level,
                    )
                )

        return result

    def _collect_values(
        self,
        disease_ids: list[str],
        cp_map: dict[str, list[ControlPoint]],
        values_by_key: dict[tuple[str, str], float],
        cp_index: int,
        indicator_id: str,
    ) -> list[float]:
        values: list[float] = []
        for disease_id in disease_ids:
            cps = cp_map.get(disease_id, [])
            if cp_index >= len(cps):
                continue
            cp = cps[cp_index]
            value = values_by_key.get((cp.id, indicator_id))
            if value is not None:
                values.append(value)
        return values

    def _filter_disease_ids(self, group_filter: GroupFilter) -> list[str]:
        stmt = select(Disease.id, Disease.medical_case_id).where(Disease.disease_name == group_filter.disease_name)
        disease_rows = self.db.execute(stmt).all()
        if not disease_rows:
            return []

        case_ids = {row.medical_case_id for row in disease_rows}
        case_stmt = select(MedicalCase).where(MedicalCase.id.in_(case_ids))
        cases = self.db.scalars(case_stmt).all()
        case_map = {case.id: case for case in cases}

        eligible: list[str] = []
        for row in disease_rows:
            case = case_map.get(row.medical_case_id)
            if not case:
                continue
            if case.gender not in group_filter.genders:
                continue
            if group_filter.min_age is not None and case.age < group_filter.min_age:
                continue
            if group_filter.max_age is not None and case.age > group_filter.max_age:
                continue
            year = case.admission_date.year
            if group_filter.min_year is not None and year < group_filter.min_year:
                continue
            if group_filter.max_year is not None and year > group_filter.max_year:
                continue
            eligible.append(row.id)

        if not eligible:
            return []

        if not group_filter.treatment:
            return eligible

        cp_stmt = select(ControlPoint.id, ControlPoint.disease_id).where(ControlPoint.disease_id.in_(eligible))
        cp_rows = self.db.execute(cp_stmt).all()
        cp_to_disease = {row.id: row.disease_id for row in cp_rows}

        dr_stmt = select(DiagnosisRecord.control_point_id, DiagnosisRecord.treatment).where(
            DiagnosisRecord.control_point_id.in_(cp_to_disease.keys())
        )
        dr_rows = self.db.execute(dr_stmt).all()

        treated_disease_ids: set[str] = set()
        treatment = (group_filter.treatment or '').strip()
        for row in dr_rows:
            if (row.treatment or '').strip() == treatment:
                disease_id = cp_to_disease.get(row.control_point_id)
                if disease_id:
                    treated_disease_ids.add(disease_id)

        return [d for d in eligible if d in treated_disease_ids]

    def _control_points_by_disease(self, disease_ids: list[str]) -> dict[str, list[ControlPoint]]:
        stmt = (
            select(ControlPoint)
            .where(ControlPoint.disease_id.in_(disease_ids))
            .order_by(ControlPoint.disease_id.asc(), ControlPoint.date.asc())
        )
        cps = self.db.scalars(stmt).all()
        grouped: dict[str, list[ControlPoint]] = defaultdict(list)
        for cp in cps:
            grouped[cp.disease_id].append(cp)
        return grouped

    def _candidate_cp_ids(self, cp_map: dict[str, list[ControlPoint]], cp_indices: list[int]) -> list[str]:
        cp_ids: set[str] = set()
        for cps in cp_map.values():
            for cp_index in cp_indices:
                if cp_index < len(cps):
                    cp_ids.add(cps[cp_index].id)
        return list(cp_ids)

    def _lab_values_by_cp_and_indicator(
        self,
        indicator_ids: list[str],
        control_point_ids: list[str],
    ) -> dict[tuple[str, str], float]:
        if not indicator_ids or not control_point_ids:
            return {}

        stmt = select(LabResult).where(
            LabResult.indicator_id.in_(indicator_ids),
            LabResult.control_point_id.in_(control_point_ids),
        )
        rows = self.db.scalars(stmt).all()
        values: dict[tuple[str, str], float] = {}
        for row in rows:
            if row.value_numeric is None:
                continue
            values[(row.control_point_id, row.indicator_id)] = float(row.value_numeric)
        return values
