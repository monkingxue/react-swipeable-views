'use strict';

const React = require('react');
const PureRenderMixin = require('react/lib/ReactComponentWithPureRenderMixin');
const {Spring} = require('react-motion');

const styles = {
  root: {
    overflowX: 'hidden',
  },
  container: {
    display: 'flex',
  },
  slide: {
    width: '100%',
    flexShrink: 0,
    overflow: 'auto',
  },
};

const SwipeableViews = React.createClass({
  propTypes: {
    children: React.PropTypes.node,
    index: React.PropTypes.number,
    onChangeIndex: React.PropTypes.func,
    style: React.PropTypes.object,
  },
  mixins: [
    PureRenderMixin,
  ],
  getDefaultProps: function() {
    return {
      index: 0,
    };
  },
  getInitialState: function() {
    return {
      index: this.props.index,
      isDragging: false,
      isFirstRender: true,
    };
  },
  componentDidMount: function() {
    this.setState({
      isFirstRender: false,
    });
  },
  componentWillReceiveProps: function(nextProps) {
    const {
      index,
    } = nextProps;

    if (typeof index === 'number' && index !== this.props.index) {
      this.setState({
        index: index,
      });
    }
  },
  handleTouchStart: function(event) {
    const touch = event.touches[0];

    this.startWidth = React.findDOMNode(this).getBoundingClientRect().width;
    this.startIndex = this.state.index;
    this.startX = touch.pageX;
    this.lastX = touch.pageX;
    this.deltaX = 0;
    this.startY = touch.pageY;
    this.isScroll = undefined;
  },
  handleTouchMove: function(event) {
    const touch = event.touches[0];

    // This is a one time test
    if (this.isScroll === undefined) {
      this.isScroll = Math.abs(this.startY - touch.pageY) > Math.abs(this.startX - touch.pageX);
    }

    if (this.isScroll) {
      return;
    }

    // Prevent native scrolling
    event.preventDefault();

    this.deltaX = touch.pageX - this.lastX;
    this.lastX = touch.pageX;

    const indexMax = React.Children.count(this.props.children) - 1;

    let index = this.startIndex + (this.startX - touch.pageX) / this.startWidth;

    if (index < 0) {
      index = 0;
    } else if (index > indexMax) {
      index = indexMax;
    }

    this.setState({
      isDragging: true,
      index: index,
    });
  },
  handleTouchEnd: function() {
    if (this.isScroll) {
      return;
    }

    let indexNew;

    // Quick movement
    if (Math.abs(this.deltaX) > 10) {
      if (this.deltaX > 0) {
        indexNew = Math.floor(this.state.index);
      } else {
        indexNew = Math.ceil(this.state.index);
      }
    } else {
      // Some hysteresis with startIndex
      if (Math.abs(this.startIndex - this.state.index) > 0.6) {
        indexNew = Math.round(this.state.index);
      } else {
        indexNew = this.startIndex;
      }
    }

    this.setState({
      index: indexNew,
      isDragging: false,
    });

    if (this.props.onChangeIndex && indexNew !== this.startIndex) {
      this.props.onChangeIndex(indexNew);
    }
  },
  renderContainer: function(translate) {
    const {
      children,
      style,
    } = this.props;

    const {
      isFirstRender,
    } = this.state;

    let childrenToRender;

    if (isFirstRender) {
      childrenToRender = children[0];
    } else {
      childrenToRender = React.Children.map(children, (element) => {
        return <div style={styles.slide}>
            {element}
          </div>;
      });
    }

    return <div style={Object.assign({
      WebkitTransform: `translate3d(${translate}px, 0, 0)`,
      transform: `translate3d(-${translate}%, 0, 0)`,
    }, styles.container, style)}>
        {childrenToRender}
      </div>;
  },
  render: function() {
    const {
      index,
      isDragging,
    } = this.state;

    const endValue = {
      val: index * 100,
      config: isDragging ? [3000, 50] : [300, 30],
    };

    return <div style={styles.root}
      onTouchStart={this.handleTouchStart} onTouchMove={this.handleTouchMove} onTouchEnd={this.handleTouchEnd}>
        <Spring endValue={endValue}>
          {interpolated => this.renderContainer(interpolated.val)}
        </Spring>
      </div>;
  },
});

module.exports = SwipeableViews;