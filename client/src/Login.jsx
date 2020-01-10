import React, { PureComponent } from 'react';

export default class Login extends PureComponent {
  render() {
    const { onLoginSubmit } = this.props;
    return (
      <div className="modal-forced">
        <div className="login">
          <input className="input" placeholder="Username" />
          <input className="input" type="password" placeholder="Password" />
          <button className="submit" type="button" onClick={onLoginSubmit}>Login/Signup</button>
        </div>
      </div>
    );
  }
}
