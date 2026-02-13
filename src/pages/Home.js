import React, { useState, useEffect } from "react";
import axios from "axios";
import L from "leaflet";
import "../App.css";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";

const API_BASE = process.env.REACT_APP_API_BASE || "/api";

// Fix Leaflet marker icon paths for bundled React builds.
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function RecenterMap({ coords }) {
  const map = useMap();

  useEffect(() => {
    map.setView(coords, map.getZoom(), { animate: true });
  }, [coords, map]);

  return null;
}

export default function Home({ user, setUser }) {
  const [ipData, setIpData] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [ip, setIp] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
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
      // loads current client geolocation + saved history on first visit
      const res = await axios.get(`${API_BASE}/home`);
      setIpData(res.data.ipData);
      setHistory(res.data.ip_history);
      setSelectedIds([]);
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
      // search external IP and refresh history from backend response
      const res = await axios.post(`${API_BASE}/home/search`, { ip });
      setIpData(res.data.ipData);
      setHistory(res.data.ip_history);
      setSelectedIds([]);
      setIp("");
      setStatus(`Showing results for ${res.data.ipData.ip}`);
    } catch (err) {
      setStatus("");
      setError(err.response?.data?.error || "Failed to fetch IP info");
    }
  };

  // search history clear and be clickable

  const handleClearSearch = async () => {
    setIp("");
    setError("");
    setStatus("Showing your current IP location");
    setLoading(true);
    await fetchDefault();
  };

  const handleHistoryClick = async (historyIp) => {
    setError("");
    setStatus("");

    try {
      const res = await axios.post(`${API_BASE}/home/lookup`, { ip: historyIp });
      setIpData(res.data.ipData);
      setStatus(`Showing results for ${res.data.ipData.ip}`);
    } catch (err) {
      setStatus("");
      setError(err.response?.data?.error || "Failed to fetch IP info");
    }
  };

  const toggleSelection = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;

    setError("");
    setStatus("");
    const deletedCount = selectedIds.length;

    try {
      const res = await axios.delete(`${API_BASE}/home/history`, {
        data: { ids: selectedIds },
      });
      setHistory(res.data.ip_history);
      setSelectedIds([]);
      setStatus(`Deleted ${deletedCount} history item${deletedCount > 1 ? "s" : ""}`);
    } catch (err) {
      setStatus("");
      setError(err.response?.data?.error || "Failed to delete selected history");
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
            <button className="btn-success" type="submit">Search</button>
            <button className="btn-neutral" type="button" onClick={handleClearSearch}>
              Clear
            </button>
          </form>

          <p className={`status status-slot ${status ? "" : "is-hidden"}`}>{status || "placeholder"}</p>
          <p className={`error error-slot ${error ? "" : "is-hidden"}`}>{error || "placeholder"}</p>

          <div className="history-header">
            <h3>Search History</h3>
            <button
              className="btn-danger"
              type="button"
              onClick={handleDeleteSelected}
              disabled={selectedIds.length === 0}
            >
              Delete Selected
            </button>
          </div>
          <ul className="history-list">
            {history.length === 0 && (
              <li className="history-empty">No search history yet. Search an IP to add it here.</li>
            )}
            {history.map((item) => (
              <li className="history-item" key={item.id}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(item.id)}
                  onChange={() => toggleSelection(item.id)}
                />
                <div className="history-text">
                  <button
                    className="history-ip-btn"
                    type="button"
                    onClick={() => handleHistoryClick(item.ip_address)}
                  >
                    {item.ip_address}
                  </button>
                  <span className="history-time">{new Date(item.created_at).toLocaleString()}</span>
                </div>
              </li>
            ))}
          </ul>

          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <div className="map-wrapper">
          <MapContainer center={coords} zoom={13} className="map">
            <RecenterMap coords={coords} />
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
