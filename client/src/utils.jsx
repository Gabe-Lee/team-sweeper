export default {
  getSession() { return window.localStorage.getItem('session'); },
  setSession(uuid) { return window.localStorage.setItem('session', uuid); },
  spaceClickInvalid(e) {
    return (
      !e
      || !e.target
      || e.target.disabled
      || !e.target.dataset
      || !e.target.dataset.coord
    );
  },
  getCoordinates(e) { return e.target.dataset.coord.split('_').map((num) => Number(num)); },
  getLoginFields(e) {
    return (e ? {
      name: e.target.parentNode.childNodes[1].value,
      password: e.target.parentNode.childNodes[2].value,
      password2: e.target.parentNode.childNodes[3].value,
    } : {});
  },
};
