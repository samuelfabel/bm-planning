package services

type ServiceError struct {
	Code    string
	Message string
	Status  int
}

/** Return the human-readable error message.
 *
 * @returns Service error message text.
 */
func (e *ServiceError) Error() string {
	return e.Message
}

/** Build a typed service error for HTTP handlers.
 *
 * @param code - Machine-readable error code.
 * @param message - Human-readable error message.
 * @param status - HTTP status code to return.
 * @returns Configured ServiceError instance.
 */
func newServiceError(code, message string, status int) *ServiceError {
	return &ServiceError{
		Code:    code,
		Message: message,
		Status:  status,
	}
}
