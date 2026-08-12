import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseType, setLicenseType] = useState("");
  const [licenseDocument, setLicenseDocument] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    if (
      !organizationName ||
      !email ||
      !role ||
      !licenseNumber ||
      !licenseType ||
      !licenseDocument ||
      !password ||
      !confirmPassword
    ) {
      alert("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    console.log("Registration submitted:", {
      organizationName,
      email,
      role,
      licenseNumber,
      licenseType,
      licenseDocument,
    });
    navigate("/pending-verification");
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create an Account</h1>

        <p>Register your organization with Secure Pharma.</p>

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="organizationName">
              Organization Name
            </label>

            <input
              id="organizationName"
              type="text"
              value={organizationName}
              onChange={(event) =>
                setOrganizationName(event.target.value)
              }
              placeholder="Enter organization name"
            />
          </div>

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

          <div>
            <label htmlFor="role">Organization Type</label>

            <select
              id="role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              <option value="">Select organization type</option>
              <option value="MANUFACTURER">Manufacturer</option>
              <option value="DISTRIBUTOR">Distributor</option>
              <option value="PHARMACY">Pharmacy</option>
            </select>
          </div>

          <div>
            <label htmlFor="licenseNumber">
              License Number
            </label>

            <input
              id="licenseNumber"
              type="text"
              value={licenseNumber}
              onChange={(event) =>
                setLicenseNumber(event.target.value)
              }
              placeholder="Enter license number"
            />
          </div>

          <div>
            <label htmlFor="licenseType">
              License Type
            </label>

            <select
              id="licenseType"
              value={licenseType}
              onChange={(event) =>
                setLicenseType(event.target.value)
              }
            >
              <option value="">Select license type</option>
              <option value="MANUFACTURING">Manufacturing License</option>
              <option value="WHOLESALE">Wholesale License</option>
              <option value="PHARMACY">Pharmacy License</option>
            </select>
          </div>

          <div>
            <label htmlFor="licenseDocument">
              License Document
            </label>

            <input
              id="licenseDocument"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(event) =>
                setLicenseDocument(event.target.files[0])
              }
            />
          </div>

          <div>
            <label htmlFor="password">Password</label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword">
              Confirm Password
            </label>

            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              placeholder="Confirm your password"
            />
          </div>

          <button type="submit">
            Register
          </button>
        </form>

        <p>
          Already have an account?{" "}
          <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;