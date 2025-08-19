// import React, { createContext, useState, useContext, useEffect } from "react";
// import axios from "axios";

// const UserContext = createContext();

// export const UserProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchUser();
//   }, []);

//   const fetchUser = async () => {
//     try {
//       const token = localStorage.getItem("token");
//       if (token) {
//         const response = await axios.get(
//           "https://api.digizooom.com/api/v1/panel/user/info",
//           {
//             headers: { Authorization: `Bearer ${token}` },
//           }
//         );
//         setUser(response.data); // Adjust if your API structure differs
//       }
//     } catch (error) {
//       console.error("Error fetching user:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loginUser = (userData, token) => {
//     // Save token and user data to localStorage
//     localStorage.setItem("token", token);
//     localStorage.setItem("user", JSON.stringify(userData));

//     // Update the user state
//     setUser(userData);
//   };

//   const logoutUser = () => {
//     localStorage.removeItem("token");
//     localStorage.removeItem("user");
//     setUser(null);
//   };

//   const updateUser = async (userData) => {
//     try {
//       const token = localStorage.getItem("token");
//       const response = await axios.put(
//         "https://your-api-url.com/api/user",
//         userData,
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );
//       setUser(response.data);
//       return response.data;
//     } catch (error) {
//       console.error("Error updating user:", error);
//       throw error;
//     }
//   };

//   return (
//     <UserContext.Provider
//       value={{
//         user,
//         loading,
//         loginUser,
//         logoutUser,
//         updateUser,
//       }}
//     >
//       {children}
//     </UserContext.Provider>
//   );
// };

// export const useUser = () => useContext(UserContext);
import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const response = await axios.get(
          "https://api.digizooom.com/api/v1/panel/user/info",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUser(response.data); // Adjust if your API structure differs
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  };

  const loginUser = (userData, token) => {
    // Save token and user data to localStorage
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));

    // Update the user state
    setUser(userData);
  };

  const logoutUser = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const updateUser = async (userData) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        "https://your-api-url.com/api/user",
        userData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        loginUser,
        logoutUser,
        updateUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// Export the useUser hook
export const useUser = () => useContext(UserContext);
