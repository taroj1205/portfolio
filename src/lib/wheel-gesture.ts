export const horizontalWheelGesture = () => {
  let last = -Infinity;
  let horizontal = false;

  return (event: Pick<WheelEvent, "deltaX" | "deltaY" | "timeStamp">) => {
    if (event.deltaX === 0 && event.deltaY === 0) {
      return false;
    }
    if (event.timeStamp - last > 180) {
      horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);
    }
    last = event.timeStamp;
    return horizontal;
  };
};
