export function ErrorMessage({ message }: { message: string }) {
  return message ? (
    <div class="error-message" role="alert">
      {message}
    </div>
  ) : null;
}
