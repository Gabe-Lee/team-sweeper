import React, { PureComponent } from 'react';

export default class Login extends PureComponent {
  render() {
    const { onLoginSubmit } = this.props;
    return (
      <div className="modal-forced">
        <div className="login">
          <div className="header">Login</div>
          <input className="input" placeholder="Username" />
          <input className="input" type="password" placeholder="Password" />
          <input className="input" type="password" placeholder="Retype Password" />
          <button className="submit" type="button" onClick={onLoginSubmit}>Login/Signup</button>
        </div>
      </div>
    );
  }
}
