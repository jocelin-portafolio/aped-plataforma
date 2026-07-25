export default function Alert({ children, type = 'info', className = '' }) {
  return (
    <div role="alert" className={`alert alert--${type} ${className}`.trim()}>
      {children}
    </div>
  );
}

Alert.Success = function AlertSuccess({ children, className = '' }) {
  return <Alert type="success" className={className}>{children}</Alert>;
};

Alert.Error = function AlertError({ children, className = '' }) {
  return <Alert type="error" className={className}>{children}</Alert>;
};
