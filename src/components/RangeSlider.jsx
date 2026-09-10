import MultiRangeSlider from "multi-range-slider-react";
import { useState } from "react";

function RangeSlider({ min = 0, max = 100, step = 1, onInput }) {

    const [minValue, setMinValue] = useState(min);
    const [maxValue, setMaxValue] = useState(max);

    return (
        <MultiRangeSlider
			min={min}
			max={max}
			step={step}
			minValue={minValue}
			maxValue={maxValue}
			onInput={(e) => {
				onInput(e);
			}}
            onChange={(e) => {
                setMinValue(e.minValue);
                setMaxValue(e.maxValue);
            }}
            label={false}
            ruler={false}
            style={{ border: "none", boxShadow: "none", padding: "15px 10px" }}
            barLeftColor="white"
            barInnerColor="#5F793E"
            barRightColor="white"
            thumbLeftColor="#5F793E"
            thumbRightColor="#5F793E"
		/>
    )

}

export default RangeSlider;