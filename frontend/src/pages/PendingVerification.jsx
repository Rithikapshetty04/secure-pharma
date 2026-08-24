function PendingVerification() {
  return (
    <div className="verification-page">
      <div className="verification-card">
        <h1>Verification Pending</h1>

        <p>
          Your registration has been submitted successfully.
        </p>

        <p>
          Your pharmaceutical license is currently under
          verification.
        </p>

        <div className="verification-status">
          <h2>Current Status</h2>

          <p>
            <strong>Pending Verification</strong>
          </p>
        </div>

        <div className="verification-info">
          <h2>What happens next?</h2>

          <ol>
            <li>
              Your submitted license document will be reviewed.
            </li>

            <li>
              The license information will be verified.
            </li>

            <li>
              An administrator or authorized regulator will review
              the verification result.
            </li>

            <li>
              Once approved, your account will be activated.
            </li>
          </ol>
        </div>

        <p>
          You will be able to access the full Secure Pharma
          platform after your account has been approved.
        </p>
      </div>
    </div>
  );
}

export default PendingVerification;