import { useAuth } from "../context/AuthContext";

function Profile() {
  const { user } = useAuth();

  return (
    <div className="profile-page">
      <h1>My Profile</h1>

      <p>View your Secure Pharma account information.</p>

      <div className="profile-card">
        <h2>Account Details</h2>

        <div>
          <strong>Email:</strong>
          <p>{user?.email || "Not available"}</p>
        </div>

        <div>
          <strong>Role:</strong>
          <p>{user?.role || "Not available"}</p>
        </div>
      </div>

      <div className="profile-card">
        <h2>Account Status</h2>

        <p>Account status will be connected to the backend later.</p>
      </div>
    </div>
  );
}

export default Profile;