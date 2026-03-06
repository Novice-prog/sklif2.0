// Утилиты для статистических тестов

// Функция нормального кумулятивного распределения (приближение)
export const normalCDF = (z: number): number => {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
};

// Функция t-распределения (приближение)
export const tDistributionCDF = (t: number, df: number): number => {
  // Используем приближение для t-распределения
  const x = df / (df + t * t);
  return 1 - 0.5 * incompleteBeta(df / 2, 0.5, x);
};

// Неполная бета-функция (приближение для t-распределения)
const incompleteBeta = (a: number, b: number, x: number): number => {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  
  // Простое приближение
  const bt = Math.exp(
    a * Math.log(x) + b * Math.log(1 - x)
  );
  
  if (x < (a + 1) / (a + b + 2)) {
    return bt * betaContinuedFraction(a, b, x) / a;
  } else {
    return 1 - bt * betaContinuedFraction(b, a, 1 - x) / b;
  }
};

const betaContinuedFraction = (a: number, b: number, x: number): number => {
  const maxIterations = 100;
  const epsilon = 1e-10;
  
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - qab * x / qap;
  
  if (Math.abs(d) < epsilon) d = epsilon;
  d = 1 / d;
  let h = d;
  
  for (let m = 1; m <= maxIterations; m++) {
    const m2 = 2 * m;
    let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < epsilon) d = epsilon;
    c = 1 + aa / c;
    if (Math.abs(c) < epsilon) c = epsilon;
    d = 1 / d;
    h *= d * c;
    
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < epsilon) d = epsilon;
    c = 1 + aa / c;
    if (Math.abs(c) < epsilon) c = epsilon;
    d = 1 / d;
    const del = d * c;
    h *= del;
    
    if (Math.abs(del - 1) < epsilon) break;
  }
  
  return h;
};

// 1. Критерий Манна-Уитни (U-тест)
export const mannWhitneyTest = (
  group1Values: number[],
  group2Values: number[]
): { statistic: number; pValue: number; statisticName: string } => {
  const n1 = group1Values.length;
  const n2 = group2Values.length;

  if (n1 === 0 || n2 === 0) {
    return { statistic: 0, pValue: 1, statisticName: 'U' };
  }

  // Объединяем выборки с метками группы
  const combined = [
    ...group1Values.map(v => ({ value: v, group: 1 })),
    ...group2Values.map(v => ({ value: v, group: 2 }))
  ];

  // Сортируем по значению
  combined.sort((a, b) => a.value - b.value);

  // Присваиваем ранги (с учетом связанных рангов)
  const ranks: { value: number; group: number; rank: number }[] = [];
  let i = 0;
  while (i < combined.length) {
    let j = i;
    // Находим все элементы с одинаковым значением
    while (j < combined.length && combined[j].value === combined[i].value) {
      j++;
    }
    // Средний ранг для связанных значений
    const avgRank = (i + 1 + j) / 2;
    for (let k = i; k < j; k++) {
      ranks.push({ ...combined[k], rank: avgRank });
    }
    i = j;
  }

  // Сумма рангов для группы 1
  const R1 = ranks.filter(r => r.group === 1).reduce((sum, r) => sum + r.rank, 0);

  // U-статистика для группы 1
  const U1 = n1 * n2 + (n1 * (n1 + 1)) / 2 - R1;
  const U2 = n1 * n2 - U1;
  const U = Math.min(U1, U2);

  // Аппроксимация нормальным распределением для вычисления p-value
  const meanU = (n1 * n2) / 2;
  const stdU = Math.sqrt((n1 * n2 * (n1 + n2 + 1)) / 12);
  const z = Math.abs((U - meanU) / stdU);

  // Двусторонний p-value
  const pValue = 2 * (1 - normalCDF(z));

  return { statistic: U, pValue, statisticName: 'U' };
};

// 2. t-критерий Стьюдента (для независимых выборок с равными дисперсиями)
export const studentTTest = (
  group1Values: number[],
  group2Values: number[]
): { statistic: number; pValue: number; statisticName: string } => {
  const n1 = group1Values.length;
  const n2 = group2Values.length;

  if (n1 < 2 || n2 < 2) {
    return { statistic: 0, pValue: 1, statisticName: 't' };
  }

  // Средние значения
  const mean1 = group1Values.reduce((sum, v) => sum + v, 0) / n1;
  const mean2 = group2Values.reduce((sum, v) => sum + v, 0) / n2;

  // Дисперсии
  const var1 = group1Values.reduce((sum, v) => sum + Math.pow(v - mean1, 2), 0) / (n1 - 1);
  const var2 = group2Values.reduce((sum, v) => sum + Math.pow(v - mean2, 2), 0) / (n2 - 1);

  // Объединенная дисперсия
  const pooledVar = ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2);

  // t-статистика
  const t = (mean1 - mean2) / Math.sqrt(pooledVar * (1 / n1 + 1 / n2));

  // Степени свободы
  const df = n1 + n2 - 2;

  // p-value (двусторонний)
  const pValue = 2 * (1 - tDistributionCDF(Math.abs(t), df));

  return { statistic: t, pValue, statisticName: 't' };
};

// 3. t-критерий Уэлча (для независимых выборок с неравными дисперсиями)
export const welchTTest = (
  group1Values: number[],
  group2Values: number[]
): { statistic: number; pValue: number; statisticName: string } => {
  const n1 = group1Values.length;
  const n2 = group2Values.length;

  if (n1 < 2 || n2 < 2) {
    return { statistic: 0, pValue: 1, statisticName: 't' };
  }

  // Средние значения
  const mean1 = group1Values.reduce((sum, v) => sum + v, 0) / n1;
  const mean2 = group2Values.reduce((sum, v) => sum + v, 0) / n2;

  // Дисперсии
  const var1 = group1Values.reduce((sum, v) => sum + Math.pow(v - mean1, 2), 0) / (n1 - 1);
  const var2 = group2Values.reduce((sum, v) => sum + Math.pow(v - mean2, 2), 0) / (n2 - 1);

  // t-статистика Уэлча
  const t = (mean1 - mean2) / Math.sqrt(var1 / n1 + var2 / n2);

  // Степени свободы Уэлча-Саттертуэйта
  const df = Math.pow(var1 / n1 + var2 / n2, 2) / 
    (Math.pow(var1 / n1, 2) / (n1 - 1) + Math.pow(var2 / n2, 2) / (n2 - 1));

  // p-value (двусторонний)
  const pValue = 2 * (1 - tDistributionCDF(Math.abs(t), df));

  return { statistic: t, pValue, statisticName: 't' };
};

// 4. Критерий Колмогорова-Смирнова (для сравнения распределений)
export const kolmogorovSmirnovTest = (
  group1Values: number[],
  group2Values: number[]
): { statistic: number; pValue: number; statisticName: string } => {
  const n1 = group1Values.length;
  const n2 = group2Values.length;

  if (n1 === 0 || n2 === 0) {
    return { statistic: 0, pValue: 1, statisticName: 'D' };
  }

  // Сортируем обе выборки
  const sorted1 = [...group1Values].sort((a, b) => a - b);
  const sorted2 = [...group2Values].sort((a, b) => a - b);

  // Объединяем все уникальные значения
  const allValues = [...new Set([...sorted1, ...sorted2])].sort((a, b) => a - b);

  // Вычисляем максимальную разность между эмпирическими функциями распределения
  let maxD = 0;
  
  allValues.forEach(value => {
    // Эмпирическая функция распределения для группы 1
    const cdf1 = sorted1.filter(v => v <= value).length / n1;
    // Эмпирическая функция распределения для группы 2
    const cdf2 = sorted2.filter(v => v <= value).length / n2;
    
    const d = Math.abs(cdf1 - cdf2);
    if (d > maxD) maxD = d;
  });

  // D-статистика
  const D = maxD;

  // Приближенный p-value для двухвыборочного теста KS
  const en = Math.sqrt((n1 * n2) / (n1 + n2));
  const lambda = (en + 0.12 + 0.11 / en) * D;
  
  // Аппроксимация распределения Колмогорова
  let pValue = 0;
  for (let i = 1; i <= 100; i++) {
    pValue += Math.pow(-1, i - 1) * Math.exp(-2 * i * i * lambda * lambda);
  }
  pValue = Math.min(1, Math.max(0, 2 * pValue));

  return { statistic: D, pValue, statisticName: 'D' };
};

// 5. Критерий Вилкоксона (парный тест для связанных выборок)
export const wilcoxonSignedRankTest = (
  values1: number[],
  values2: number[]
): { statistic: number; pValue: number; statisticName: string } => {
  if (values1.length !== values2.length || values1.length === 0) {
    return { statistic: 0, pValue: 1, statisticName: 'W' };
  }

  // Вычисляем разности
  const differences = values1.map((v, i) => values2[i] - v);
  
  // Убираем нулевые разности
  const nonZeroDiffs = differences.filter(d => d !== 0);
  const n = nonZeroDiffs.length;

  if (n === 0) {
    return { statistic: 0, pValue: 1, statisticName: 'W' };
  }

  // Ранжируем по абсолютным значениям
  const ranked = nonZeroDiffs
    .map((d, i) => ({ diff: d, absDiff: Math.abs(d), index: i }))
    .sort((a, b) => a.absDiff - b.absDiff);

  // Присваиваем ранги (с учетом связанных рангов)
  const ranks: { diff: number; rank: number }[] = [];
  let i = 0;
  while (i < ranked.length) {
    let j = i;
    while (j < ranked.length && ranked[j].absDiff === ranked[i].absDiff) {
      j++;
    }
    const avgRank = (i + 1 + j) / 2;
    for (let k = i; k < j; k++) {
      ranks.push({ diff: ranked[k].diff, rank: avgRank });
    }
    i = j;
  }

  // Сумма рангов для положительных разностей
  const wPlus = ranks.filter(r => r.diff > 0).reduce((sum, r) => sum + r.rank, 0);
  
  // Сумма рангов для отрицательных разностей
  const wMinus = ranks.filter(r => r.diff < 0).reduce((sum, r) => sum + r.rank, 0);

  // W-статистика (меньшая из сумм)
  const W = Math.min(wPlus, wMinus);

  // Приближение нормальным распределением
  const meanW = (n * (n + 1)) / 4;
  const stdW = Math.sqrt((n * (n + 1) * (2 * n + 1)) / 24);
  const z = Math.abs((W - meanW) / stdW);

  // Двусторонний p-value
  const pValue = 2 * (1 - normalCDF(z));

  return { statistic: W, pValue, statisticName: 'W' };
};

// 6. Парный t-критерий Стьюдента (для связанных выборок)
export const pairedTTest = (
  values1: number[],
  values2: number[]
): { statistic: number; pValue: number; statisticName: string } => {
  if (values1.length !== values2.length || values1.length < 2) {
    return { statistic: 0, pValue: 1, statisticName: 't' };
  }

  const n = values1.length;

  // Вычисляем разности
  const differences = values1.map((v, i) => values2[i] - v);

  // Среднее разностей
  const meanDiff = differences.reduce((sum, d) => sum + d, 0) / n;

  // Стандартное отклонение разностей
  const variance = differences.reduce((sum, d) => sum + Math.pow(d - meanDiff, 2), 0) / (n - 1);
  const stdDiff = Math.sqrt(variance);

  // t-статистика
  const t = meanDiff / (stdDiff / Math.sqrt(n));

  // Степени свободы
  const df = n - 1;

  // p-value (двусторонний)
  const pValue = 2 * (1 - tDistributionCDF(Math.abs(t), df));

  return { statistic: t, pValue, statisticName: 't' };
};
