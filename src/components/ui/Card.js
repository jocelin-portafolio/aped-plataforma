export default function Card({
  children,
  id,
  variant = 'default',
  className = '',
  as: Tag = 'article',
  ...props
}) {
  return (
    <Tag
      className={`card card--${variant} ${className}`.trim()}
      id={id}
      {...props}
    >
      {children}
    </Tag>
  );
}

Card.Header = function CardHeader({ children, className = '' }) {
  return <div className={`card-header ${className}`.trim()}>{children}</div>;
};

Card.Body = function CardBody({ children, className = '' }) {
  return <div className={`card-body ${className}`.trim()}>{children}</div>;
};

Card.Footer = function CardFooter({ children, className = '' }) {
  return <div className={`card-footer ${className}`.trim()}>{children}</div>;
};
