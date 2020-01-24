import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import utils from './utils';
import { setPlayer, setSession } from './redux/actions';
import { server } from '../../env';

const MODE = {
  SIGNUP: {
    TEXT: 'Signup',
    SWITCH: 'Have an account? Go to login.',
    URL: '/signup',
  },
  LOGIN: {
    TEXT: 'Login',
    SWITCH: 'No account? Signup now!',
    URL: '/login',
  },
};

const Login = () => {
  const dispatch = useDispatch();
  const [mode, setMode] = useState(MODE.LOGIN);
  const { sessionAttempted } = useSelector((store) => store.login);

  const submitLogin = useCallback((event) => {
    const { name, password, password2 } = utils.getLoginFields(event);
    if (mode.TEXT === MODE.SIGNUP.TEXT && password !== password2) return;
    axios.post(mode.URL, { name, password }, {
      baseURL: server.env.URL,
    }).then((response) => {
      utils.setSession(response.data.session);
      dispatch(setSession(response.data.session));
      dispatch(setPlayer(response.data.user));
    }).catch(() => console.log('login error'));
  });

  return (
    <div className="modal-forced">
      <div className="login">
        {sessionAttempted ? (
          <>
            <div className="header">{mode.TEXT}</div>
            <input className="username input" placeholder="Username" />
            <input className="password input" type="password" placeholder="Password" />
            {mode.TEXT === MODE.SIGNUP.TEXT ? <input className="password input" type="password" placeholder="Retype Password" /> : ''}
            <button className="submit button" type="button" data-mode={mode.TEXT} onClick={submitLogin}>{mode.TEXT}</button>
            <button className="mode button" type="button" data-mode={mode.TEXT} onClick={() => setMode(mode.TEXT === MODE.LOGIN.TEXT ? MODE.SIGNUP : MODE.LOGIN)}>{mode.SWITCH}</button>
          </>
        ) : <div className="loading">Loading</div>}
      </div>
    </div>
  );
};
export default Login;
