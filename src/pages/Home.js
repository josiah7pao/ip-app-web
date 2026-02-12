import React, { useState, useEffect } from "react";
import axios from "axios";
import "../App.css";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

const API_BASE = process.env.REACT_APP_API_BASE || "/api";

export default function Home({ user, setUser }) {
  const [ipData, setIpData] = useState(null);
  const [history, setHistory] = useState([]);
  const [ip, setIp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const isPrivateIP = (value) => {
    // frontend validation in case of invalid private IPv4 searches 
    return (
      value.startsWith("10.") ||
      value.startsWith("192.168.") ||
      value.startsWith("127.") ||
      value.startsWith("172.16.") ||
      value.startsWith("172.17.") ||
      value.startsWith("172.18.") ||
      value.startsWith("172.19.") ||
      value.startsWith("172.2")
    );
  };

  const fetchDefault = async () => {
    try {
      // loads current client geolocation + saved history on first visit.
      const res = await axios.get(`${API_BASE}/home`);
      setIpData(res.data.ipData);
      setHistory(res.data.ip_history);
    } catch {
      setError("Failed to fetch IP info");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDefault();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError("");

    if (!ip) return setError("Enter an IP address");

    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) {
      return setError("Invalid IP format");
    }

    if (isPrivateIP(ip)) {
      return setError("Private IP addresses cannot be searched");
    }

    try {
      // search external IP and refresh history from backend response.
      const res = await axios.post(`${API_BASE}/home/search`, { ip });
      setIpData(res.data.ipData);
      setHistory(res.data.ip_history);
      setIp("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch IP info");
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  if (loading) return <div className="center-screen">Loading...</div>;
  if (!ipData) return <div className="center-screen">No data found</div>;

  const coords = ipData.loc ? ipData.loc.split(",").map(Number) : [0, 0];

  return (
    <div className="page">
      <div className="split-layout">
        <div className="card">
          <h2>IP Information</h2>

          <p>
            <strong>IP:</strong> {ipData.ip}
          </p>
          <p>
            <strong>City:</strong> {ipData.city}
          </p>
          <p>
            <strong>Region:</strong> {ipData.region}
          </p>
          <p>
            <strong>Country:</strong> {ipData.country}
          </p>

          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Search IP address"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>

          {error && <p className="error">{error}</p>}

          <h3>Search History</h3>
          <ul>
            {history.map((item) => (
              <li key={item.id}>
                {item.ip_address} - {new Date(item.created_at).toLocaleString()}
              </li>
            ))}
          </ul>

          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <div className="map-wrapper">
          <MapContainer center={coords} zoom={13} className="map">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            <Marker position={coords}>
              <Popup>
                {ipData.city}, {ipData.region}, {ipData.country}
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
