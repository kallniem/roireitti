import MultiRangeSlider from "multi-range-slider-react";
import { useEffect, useState } from "react";

function RangeSlider({ min = 0, max = 100, step = 1, value, onChange }) {

    const [minValue, setMinValue] = useState(value?.min ?? min);
    const [maxValue, setMaxValue] = useState(value?.max ?? max);

    useEffect(() => {
        setMinValue(value?.min ?? min);
        setMaxValue(value?.max ?? max);
    }, [min, max, value]);

    const handleInput = (e) => {
        setMinValue(e.minValue);
        setMaxValue(e.maxValue);

        if (onChange) {
            onChange({ min: e.minValue, max: e.maxValue });
        }
    };

    return (
        <MultiRangeSlider
			min={min}
			max={max}
			step={step}
			minValue={minValue}
			maxValue={maxValue}
			onInput={handleInput}
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