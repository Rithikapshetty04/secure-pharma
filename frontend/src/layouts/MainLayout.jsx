import Navbar from "../components/Navbar";

function MainLayout({ children }) {
  return (
    <div className="app-layout">
      <Navbar />

      <main className="app-main">
        {children}
      </main>
    </div>
  );
}

export default MainLayout;