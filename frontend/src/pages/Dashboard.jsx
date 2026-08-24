import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user } = useAuth();

  const role = user?.role || "USER";

  const isAdmin = role === "ADMIN";
  const isManufacturer = role === "MANUFACTURER";
  const isDistributor = role === "DISTRIBUTOR";
  const isPharmacy = role === "PHARMACY";

  return (
    <div className="dashboard-page">
      <h1>Secure Pharma Dashboard</h1>

      <p>
        Welcome back, {user?.email || "User"}.
      </p>

      <div className="dashboard-card">
        <h2>Account Information</h2>

        <p>
          <strong>Email:</strong>{" "}
          {user?.email || "Not available"}
        </p>

        <p>
          <strong>Role:</strong>{" "}
          {role}
        </p>
      </div>

      {isAdmin && (
        <div className="dashboard-card">
          <h2>Administrator</h2>

          <p>
            Manage users, organizations, verification requests,
            and platform activities.
          </p>
        </div>
      )}

      {isManufacturer && (
        <div className="dashboard-card">
          <h2>Manufacturer</h2>

          <p>
            Manage pharmaceutical products, batches, and
            manufacturing supply-chain events.
          </p>
        </div>
      )}

      {isDistributor && (
        <div className="dashboard-card">
          <h2>Distributor</h2>

          <p>
            Manage product shipments, transfers, and distribution
            supply-chain events.
          </p>
        </div>
      )}

      {isPharmacy && (
        <div className="dashboard-card">
          <h2>Pharmacy</h2>

          <p>
            Track received pharmaceutical products and verify
            product traceability.
          </p>
        </div>
      )}

      {role === "USER" && (
        <div className="dashboard-card">
          <h2>Platform Access</h2>

          <p>
            Your account is ready to use the Secure Pharma
            platform.
          </p>
        </div>
      )}

      <div className="dashboard-card">
        <h2>Verification Status</h2>

        <p>
          Account and license verification status will be connected
          to the backend later.
        </p>
      </div>
    </div>
  );
}

export default Dashboard;