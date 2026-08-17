const register = async (req, res) => {
  res.status(501).json({
    success: false,
    message: "Registration API implementation pending",
  });
};

const login = async (req, res) => {
  res.status(501).json({
    success: false,
    message: "Login API implementation pending",
  });
};

module.exports = {
  register,
  login,
};