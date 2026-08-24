import { useState } from "react";
import { Link } from "react-router-dom";

function ForgotPassword() {
  const [email, setEmail] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!email) {
      alert("Please enter your email.");
      return;
    }

    console.log("Password reset requested for:", email);
    alert("Password reset request submitted.");
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Forgot Password?</h1>

        <p>
          Enter your registered email to reset your password.
        </p>

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email">Email</label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
            />
          </div>

          <button type="submit">
            Send Reset Link
          </button>
        </form>

        <p>
          <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;