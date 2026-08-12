import { Link } from "react-router-dom";

function PendingVerification() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Verification Pending</h1>

        <p>
          Your registration has been submitted successfully.
        </p>

        <p>
          Your license document is currently under verification
          by the Secure Pharma administration team.
        </p>

        <p>
          You will be able to access your account after your
          organization and license have been approved.
        </p>

        <div>
          <strong>Status:</strong> Pending Verification
        </div>

        <p>
          Please wait while the verification process is completed.
        </p>

        <Link to="/">
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export default PendingVerification;