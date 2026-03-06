from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

UserRole = Literal[
    'admin',
    'doctor',
    'junior_researcher',
    'researcher',
    'senior_researcher',
    'lead_researcher',
]


class TokenPayload(BaseModel):
    sub: str
    role: UserRole = 'doctor'
    exp: int | None = None


class CurrentUser(BaseModel):
    subject: str
    role: UserRole


class LoginRequest(BaseModel):
    identifier: str = Field(min_length=1)
    password: str = Field(min_length=1)


class LoginUserInfo(BaseModel):
    id: str
    email: str
    login: str
    full_name: str
    role: UserRole


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = 'bearer'
    expires_in: int
    user: LoginUserInfo


class AdminUserDTO(BaseModel):
    id: str
    email: str
    login: str
    full_name: str
    role: UserRole
    is_active: bool
    created_at: datetime


class AdminUsersResponse(BaseModel):
    users: list[AdminUserDTO]


class CreateUserRequest(BaseModel):
    full_name: str = Field(min_length=1)
    email: str
    role: UserRole
    login: str | None = None


class UpdateUserRequest(BaseModel):
    full_name: str | None = None
    email: str | None = None
    role: UserRole | None = None


class UserCredentials(BaseModel):
    email: str
    login: str
    password: str


class UserCredentialsResponse(BaseModel):
    credentials: UserCredentials
