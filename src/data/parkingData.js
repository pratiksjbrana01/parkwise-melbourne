/**
 * ParkWise Melbourne - Mock Parking Data
 * 
 * This file contains simulated parking zone data for the Melbourne/Richmond
 * pilot area. Data is for demonstration purposes only and does not reflect
 * real parking rules or restrictions.
 */

const parkingZones = [
  {
    id: 1,
    name: "Swan Street",
    location: "Near Bridge Rd intersection",
    x: 25,
    y: 35,
    status: "green",
    statusLabel: "Allowed Now",
    rule: "Unrestricted parking, 2P limit applies",
    allowedDuration: "2 hours",
    restrictions: "No restrictions currently active",
    restrictionChangeTime: null,
    allowedFor: ["Car", "Motorbike"],
    purposes: ["Shopping", "Work", "University", "Other"],
    expiryEstimate: "2 hours from now",
    reasonUnavailable: null,
  },
  {
    id: 2,
    name: "Bridge Road",
    location: "East Melbourne section",
    x: 55,
    y: 25,
    status: "yellow",
    statusLabel: "Limited Time",
    rule: "1P zone — metered parking",
    allowedDuration: "1 hour",
    restrictions: "Clearway begins at 4:00 PM",
    restrictionChangeTime: "4:00 PM today",
    allowedFor: ["Car", "Motorbike"],
    purposes: ["Shopping", "Work"],
    expiryEstimate: "1 hour from now",
    reasonUnavailable: null,
  },
  {
    id: 3,
    name: "Flinders Lane",
    location: "CBD — near Swanston St",
    x: 45,
    y: 65,
    status: "red",
    statusLabel: "Restricted Now",
    rule: "Clearway — no stopping",
    allowedDuration: null,
    restrictions: "Clearway active 3:00 PM – 7:00 PM",
    restrictionChangeTime: "7:00 PM today",
    allowedFor: [],
    purposes: [],
    expiryEstimate: null,
    reasonUnavailable: "This is an active clearway zone. No vehicles are permitted to stop or park during clearway hours. Parking may become available after 7:00 PM.",
  },
  {
    id: 4,
    name: "Church Street",
    location: "Richmond — near Victoria St",
    x: 75,
    y: 50,
    status: "blue",
    statusLabel: "Permit Required",
    rule: "Resident permit holders only",
    allowedDuration: null,
    restrictions: "Valid council parking permit required",
    restrictionChangeTime: null,
    allowedFor: [],
    purposes: [],
    expiryEstimate: null,
    reasonUnavailable: "This is a resident permit parking zone. A valid council parking permit is required to park here. General parking is not available in this zone.",
  },
];

/**
 * Get a parking zone by its ID
 * @param {number} id - The zone ID
 * @returns {object|undefined} The parking zone or undefined
 */
export const getZoneById = (id) => {
  return parkingZones.find((zone) => zone.id === id);
};

/**
 * Get zones filtered by user preferences
 * @param {object} preferences - User parking preferences
 * @returns {array} Filtered zones
 */
export const getFilteredZones = (preferences) => {
  return parkingZones.map((zone) => {
    const vehicleMatch =
      !preferences.vehicleType ||
      zone.allowedFor.length === 0 ||
      zone.allowedFor.includes(preferences.vehicleType);

    return {
      ...zone,
      compatible: vehicleMatch,
    };
  });
};

export default parkingZones;