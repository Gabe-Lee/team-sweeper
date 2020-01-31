import React, { PureComponent } from 'react';
import T from 'prop-types';

export default class Space extends PureComponent {
  render() {
    const { coord, mines } = this.props;
    return (
      <button
        className={`space mines_${mines}`}
        alt="value"
        type="button"
        disabled={mines >= 0 || mines === -3}
        data-coord={coord}
      >
        <div className={`symbol mines_${mines}`} data-coord={coord}>{Space.getSymbol(mines)}</div>
      </button>
    );
  }
}
// -3 = visible mine
// -2 = flagged spot
// -1 = untested spot
// 0 = spot with no nearby mines
Space.getSymbol = (mines) => {
  if (mines === -3) return '⚙';
  if (mines === -2) return '🏴';
  if (mines <= 0) return ' ';
  return mines;
};
Space.propTypes = {
  mines: T.number.isRequired,
  coord: T.string.isRequired,
};
