const config = {
  apiUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5955'
    : `http://${window.location.hostname}:5955`
};

export default config;