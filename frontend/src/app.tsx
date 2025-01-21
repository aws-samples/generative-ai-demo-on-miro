import * as React from 'react';
import {createRoot} from 'react-dom/client';
import { Logo } from './Components/Logo';
import { Select } from './Components/Select';
import {Radio } from './Components/Radio';
import { Button } from './Components/Button';
import scenarios from './data/scenarios.json';
// Removed models import as we use scenarios mapping directly
import resolutions  from './data/resolutions.json';
import regions from './data/regions.json';
import { getPromptFromStickies, getInitImageUrl, createWaitShapeOnBoard, generateImage, createImageOnBoard, removeItemFromBoard, findItemOnBoard } from './Services';

import '../src/assets/style.css';
import logoImage from '../src/assets/bedrocklogo.svg';

const scenarioOptions = [ { label: "Generate" , value: "Generate"}, { label: "Transform" , value: "Transform"}, { label: "Inpaint" , value: "Inpaint"}]
const orientationOptions = [ { label: "Landscape" , value: 'landscape'}, { label: "Portrait" , value: 'portrait'} ];

type ModelKey = keyof typeof resolutions;

const App: React.FC = () => {
	const [selectedScenario, setSelectedScenario] = React.useState<string>(scenarioOptions[0].value);
	const [selectedModel, setSelectedModel] = React.useState<ModelKey>('stability.stable-diffusion-xl-v1');
	const [selectedOrientation, setSelectedOrientation] = React.useState<string>(orientationOptions[0].value);
	const [selectedResolution, setSelectedResolution] = React.useState<string>('');
	const [selectedRegion, setSelectedRegion] = React.useState<string>('');

	const transformToPortrait = (resolutions: { value: string, label: string }[]) => {
		return resolutions.map(res => {
			const [width, height] = res.value.split(' x ');
			return {value: `${height} x ${width}`, label: `${height} x ${width}`};
		});
	};



	const resolutionOptions = React.useMemo(() => {
		const resOptions = resolutions[selectedModel];
		return selectedOrientation === 'portrait' ? transformToPortrait(resOptions) : resOptions;
	}, [selectedModel, selectedOrientation]);

	const regionOptions = React.useMemo(() => regions[selectedModel], [selectedModel]);

	React.useEffect(() => {
		setSelectedResolution(resolutionOptions[0].value);
		setSelectedRegion(regionOptions[0].value);
	}, [selectedModel, resolutionOptions, regionOptions]);


	const handleGenerate = async () => {
		try {
			console.log('Generating...');
			const {prompt, negativePrompt, x, y, width, height} = await getPromptFromStickies();
			const {initImage, shapePosition} = await getInitImageUrl();
			const waitShape = await createWaitShapeOnBoard(x + width / 2, y + height + 200);
			const {image} = await generateImage(selectedScenario, prompt, negativePrompt, initImage, shapePosition, selectedRegion, selectedModel, selectedResolution);
			const updateWaitShape = await findItemOnBoard(waitShape.id);
			await createImageOnBoard(`data:image/png;base64,${image}`, width, updateWaitShape.x, updateWaitShape.y);
			await removeItemFromBoard(updateWaitShape);
		} catch (error) {
			console.error('Error during generation process:', error);
		}
	};


	const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const newValue = event.target.value as ModelKey;
		if (Object.keys(resolutions).includes(newValue)) {
			setSelectedModel(newValue);
		} else {
			console.error("Invalid model key: resolution is not supported", newValue);
		}
	};


	return (
		<div className="grid wrapper">
			<Logo src={logoImage} alt="Bedrock logo"/>
			<Radio
				options={scenarioOptions}
				value={selectedScenario}
				onChange={(event) => setSelectedScenario(event.target.value)}
			/>
			<Select
				id="select-model"
				label="Select a model"
				value={selectedModel}
				onChange={handleModelChange}
				options={scenarios[selectedScenario]}
			/>
			<Radio
				options={orientationOptions}
				value={selectedOrientation}
				onChange={(event) => setSelectedOrientation(event.target.value)}
			/>
			<Select
				id="select-resolution"
				label="Select a resolution"
				value={selectedResolution}
				onChange={(event) => setSelectedResolution(event.target.value)}
				options={resolutionOptions}
			/>
			<Select
				id="select-region"
				label="Select a region"
				value={selectedRegion}
				onChange={(event) => setSelectedRegion(event.target.value)}
				options={regionOptions}
			/>
			<Button buttonText={selectedScenario} onClick={handleGenerate}/>
		</div>
	);
}

const container = document.getElementById('root');
if (container !== null) {
	const root = createRoot(container);
	root.render(<App/>);
} else {
	console.error('Failed to find the root element');
}

