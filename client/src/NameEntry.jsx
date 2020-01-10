import React, { PureComponent } from 'react';

export default class NameEntry extends PureComponent {
  render() {
    const { onNameSubmit } = this.props;
    return (
      <div className="modal-forced">
        <div className="name-entry">
          <input className="input" placeholder="Enter your name..." />
          <button className="submit" type="button" onClick={onNameSubmit}>Connect</button>
        </div>
      </div>
    );
  }
}
