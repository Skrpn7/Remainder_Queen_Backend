class ApiResponse {
  constructor({
    errorMessages = null,
    isSuccess = true,
    result = null,
    statusCode = 200,
    totalRecords = 0,
  } = {}) {
    this.errorMessages = errorMessages;
    this.isSuccess = isSuccess;
    this.result = result;
    this.statusCode = statusCode;
    this.totalRecords = totalRecords;
  }

  // ✅ Success response
  static success(result, totalRecords = 0, statusCode = 200) {
    return new ApiResponse({
      isSuccess: true,
      result,
      statusCode,
      totalRecords,
    });
  }

  // ❌ Error response
  static error(errorMessages, statusCode = 500) {
    return new ApiResponse({
      errorMessages,
      isSuccess: false,
      result: null,
      statusCode,
      totalRecords: 0,
    });
  }
}

module.exports = ApiResponse;
