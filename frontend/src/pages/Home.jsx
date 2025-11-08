import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Home() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get("/api/mixer/stats");
      setStats(response.data.stats);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  return (
    <div className="container home-wrapper">
      {/* TITLE + TAGLINE */}
      <div className="home-hero">
        <h1 className="home-title">XCRO</h1>
        <p className="home-tagline">
          The world’s least legal auction platform.
          <br />
        </p>
      </div>

      {/* WIDE MISSION STRIP */}
      <section className="home-mission">
        <h2 className="mission-title"> Our Totally Honest Mission</h2>
        <p className="mission-text">
          Born from silence and necessity, XCRO deals in what the world hides.
          Art, information, reputation — everything has a price here.
          <br /><br />
           <em>“Take quietly. Leave nothing.”</em>
          <br />
          <br />
          Every transaction is encrypted, anonymous, and slightly terrifying.
          Bid fast, trust no one, and remember, the house always wins.
        </p>
      </section>

      {/* OPTIONAL SYSTEM STATS */}
      <div className="home-stats">
        {stats ? (
          <p>
            <span className="text-accent">Active Auctions:</span>{" "}
            {stats.auctions || "???"} &nbsp;|&nbsp;
            <span className="text-accent">Anonymous Users:</span>{" "}
            {stats.users || "classified"} &nbsp;|&nbsp;
            <span className="text-accent">Server Uptime:</span>{" "}
            {stats.uptime || "unstable"}%
          </p>
        ) : (
          <p className="text-muted">
            Establishing secure tunnel... please don’t trace this connection.
          </p>
        )}
      </div>
    </div>
  );
}
