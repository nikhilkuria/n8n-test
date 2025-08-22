import { AIMessage, AIMessageChunk, HumanMessage } from '@langchain/core/messages';
import { SequentialFakeStreamingChatModel } from '../SequentialFakeStreamingChatModel';

describe('SequentialFakeStreamingChatModel', () => {
	let model: SequentialFakeStreamingChatModel;
	let testResponses: AIMessage[];
	let testChunks: AIMessageChunk[];

	beforeEach(() => {
		testResponses = [
			new AIMessage({ content: 'First response' }),
			new AIMessage({ content: 'Second response' }),
			new AIMessage({ content: 'Third response' }),
		];

		testChunks = testResponses.map(
			(msg) =>
				new AIMessageChunk({
					content: msg.content as string,
				}),
		);

		model = new SequentialFakeStreamingChatModel(testChunks, testResponses);
	});

	describe('constructor', () => {
		it('should initialize with chunks and responses', () => {
			expect(model).toBeDefined();
			expect(model.getResponseInfo().totalResponses).toBe(3);
			expect(model.getResponseInfo().currentIndex).toBe(0);
			expect(model.getResponseInfo().hasResponses).toBe(true);
		});
	});

	describe('lc_namespace', () => {
		it('should return correct namespace for chat model validation', () => {
			expect(model.lc_namespace).toEqual(['langchain', 'chat_models', 'fake']);
		});
	});

	describe('bindTools', () => {
		it('should return a proxy that intercepts invoke calls', async () => {
			const tools = [{ name: 'test_tool', description: 'A test tool' }];
			const boundModel = model.bindTools(tools);

			expect(boundModel).toBeDefined();
			expect(typeof boundModel.invoke).toBe('function');
		});

		it('should use sequential responses when invoke is called', async () => {
			const tools = [{ name: 'test_tool', description: 'A test tool' }];
			const boundModel = model.bindTools(tools);

			const response1 = await boundModel.invoke([new HumanMessage('Test')]);
			const response2 = await boundModel.invoke([new HumanMessage('Test')]);
			const response3 = await boundModel.invoke([new HumanMessage('Test')]);

			expect(response1.content).toBe('First response');
			expect(response2.content).toBe('Second response');
			expect(response3.content).toBe('Third response');
		});

		it('should cycle through responses when all are used', async () => {
			const tools = [{ name: 'test_tool', description: 'A test tool' }];
			const boundModel = model.bindTools(tools);

			// Use all responses once
			await boundModel.invoke([new HumanMessage('Test')]);
			await boundModel.invoke([new HumanMessage('Test')]);
			await boundModel.invoke([new HumanMessage('Test')]);

			// Should cycle back to first response
			const response4 = await boundModel.invoke([new HumanMessage('Test')]);
			expect(response4.content).toBe('First response');
		});

		it('should preserve other LangChain functionality', async () => {
			const tools = [{ name: 'test_tool', description: 'A test tool' }];
			const boundModel = model.bindTools(tools);

			// Test that non-invoke methods still work
			expect(boundModel.lc_namespace).toBeDefined();
		});
	});

	describe('resetResponses', () => {
		it('should reset the response sequence', async () => {
			const tools = [{ name: 'test_tool', description: 'A test tool' }];
			const boundModel = model.bindTools(tools);

			// Use some responses
			await boundModel.invoke([new HumanMessage('Test')]);
			await boundModel.invoke([new HumanMessage('Test')]);

			expect(model.getResponseInfo().currentIndex).toBe(2);

			// Reset
			model.resetResponses();
			expect(model.getResponseInfo().currentIndex).toBe(0);

			// Should start from first response again
			const response = await boundModel.invoke([new HumanMessage('Test')]);
			expect(response.content).toBe('First response');
		});
	});

	describe('getResponseInfo', () => {
		it('should provide correct response information', async () => {
			const tools = [{ name: 'test_tool', description: 'A test tool' }];
			const boundModel = model.bindTools(tools);

			let info = model.getResponseInfo();
			expect(info.currentIndex).toBe(0);
			expect(info.totalResponses).toBe(3);
			expect(info.hasResponses).toBe(true);

			// Use one response
			await boundModel.invoke([new HumanMessage('Test')]);

			info = model.getResponseInfo();
			expect(info.currentIndex).toBe(1);
			expect(info.totalResponses).toBe(3);
			expect(info.hasResponses).toBe(true);
		});
	});

	describe('empty responses handling', () => {
		it('should handle empty responses gracefully', async () => {
			const emptyModel = new SequentialFakeStreamingChatModel([], []);
			const tools = [{ name: 'test_tool', description: 'A test tool' }];
			const boundModel = emptyModel.bindTools(tools);

			const response = await boundModel.invoke([new HumanMessage('Test')]);
			expect(response.content).toBe('No responses configured');
		});
	});
});
