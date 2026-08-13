function Home() {
  return (
    <div className="home-page">
      <section className="hero-section">
        <h1>Secure Pharma</h1>

        <p>
          A secure pharmaceutical supply-chain platform for
          organization verification, product traceability,
          and transparent supply-chain management.
        </p>
      </section>

      <section className="features-section">
        <div className="feature-card">
          <h2>Organization Verification</h2>

          <p>
            Verify pharmaceutical organizations and their licenses
            before allowing them to participate in the platform.
          </p>
        </div>

        <div className="feature-card">
          <h2>Product Traceability</h2>

          <p>
            Track pharmaceutical products and batches throughout
            the supply chain.
          </p>
        </div>

        <div className="feature-card">
          <h2>Blockchain Security</h2>

          <p>
            Maintain trustworthy supply-chain records using
            blockchain-based transaction tracking.
          </p>
        </div>
      </section>

      <section className="workflow-section">
        <h2>How Secure Pharma Works</h2>

        <ol>
          <li>Register your pharmaceutical organization.</li>
          <li>Submit and verify your license.</li>
          <li>Create and track pharmaceutical products.</li>
          <li>Record supply-chain events.</li>
          <li>Verify the product journey.</li>
        </ol>
      </section>
    </div>
  );
}

export default Home;