import { useEffect, useState } from "react";
import axios from "axios";

export function useAuth() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    axios
      .get("http://localhost:3001/staff/me", {
        withCredentials: true,
      })
      .then((res) => {
        setIsAuthenticated(res.status === 200);
      })
      .catch(() => {
        setIsAuthenticated(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return {
    loading,
    isAuthenticated,
  };
}
