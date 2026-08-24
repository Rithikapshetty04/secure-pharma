import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    organizationName: "",
    organizationType: "",
    licenseNumber: "",
    licenseType: "",
    licenseDocument: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value, files } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!formData.name || !formData.email || !formData.password) {
      setError("Please complete all user information.");
      return;
    }

    if (
      !formData.organizationName ||
      !formData.organizationType
    ) {
      setError("Please complete all organization information.");
      return;
    }

    if (
      !formData.licenseNumber ||
      !formData.licenseType ||
      !formData.licenseDocument
    ) {
      setError("Please provide all license information and upload the license document.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await registerUser(formData);

      console.log("Registration response:", response);

      alert(
        response.message ||
          "Registration submitted successfully. Your license is now pending verification."
      );

      navigate("/pending-verification");
    } catch (error) {
      console.error("Registration error:", error);

      if (error?.message === "Failed to fetch") {
        setError(
          "Unable to connect to the server. Please try again later."
        );
      } else {
        setError(
          error?.message || "Registration failed. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create Account</h1>

        <p>
          Register your organization and submit your pharmaceutical
          license for verification.
        </p>

        {error && (
          <p role="alert">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <h2>User Information</h2>

          <div>
            <label htmlFor="name">Full Name</label>

            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <label htmlFor="email">Email</label>

            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label htmlFor="password">Password</label>

            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              required
            />
          </div>

          <h2>Organization Information</h2>

          <div>
            <label htmlFor="organizationName">
              Organization Name
            </label>

            <input
              id="organizationName"
              name="organizationName"
              type="text"
              value={formData.organizationName}
              onChange={handleChange}
              placeholder="Enter organization name"
              required
            />
          </div>

          <div>
            <label htmlFor="organizationType">
              Organization Type
            </label>

            <select
              id="organizationType"
              name="organizationType"
              value={formData.organizationType}
              onChange={handleChange}
              required
            >
              <option value="">Select organization type</option>
              <option value="MANUFACTURER">Manufacturer</option>
              <option value="DISTRIBUTOR">Distributor</option>
              <option value="PHARMACY">Pharmacy</option>
            </select>
          </div>

          <h2>License Information</h2>

          <div>
            <label htmlFor="licenseNumber">
              License Number
            </label>

            <input
              id="licenseNumber"
              name="licenseNumber"
              type="text"
              value={formData.licenseNumber}
              onChange={handleChange}
              placeholder="Enter license number"
              required
            />
          </div>

          <div>
            <label htmlFor="licenseType">
              License Type
            </label>

            <select
              id="licenseType"
              name="licenseType"
              value={formData.licenseType}
              onChange={handleChange}
              required
            >
              <option value="">Select license type</option>
              <option value="MANUFACTURING">Manufacturing</option>
              <option value="WHOLESALE">Wholesale</option>
              <option value="PHARMACY">Pharmacy</option>
            </select>
          </div>

          <div>
            <label htmlFor="licenseDocument">
              Upload License Document
            </label>

            <input
              id="licenseDocument"
              name="licenseDocument"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Submitting..." : "Submit Registration"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Register;