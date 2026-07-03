package services

type ServiceError struct {
	Code    string
	Message string
	Status  int
}

func (e *ServiceError) Error() string {
	return e.Message
}

func newServiceError(code, message string, status int) *ServiceError {
	return &ServiceError{
		Code:    code,
		Message: message,
		Status:  status,
	}
}
