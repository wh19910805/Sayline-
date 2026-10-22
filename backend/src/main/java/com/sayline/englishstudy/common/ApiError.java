package com.sayline.englishstudy.common;

public record ApiError(String code, int status, String detail, String requestId) {
}
