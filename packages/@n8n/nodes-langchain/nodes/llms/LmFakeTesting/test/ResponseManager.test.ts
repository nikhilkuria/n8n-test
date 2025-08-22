import { AIMessage } from '@langchain/core/messages';
import { ResponseManager } from '../ResponseManager';

describe('ResponseManager', () => {
	let responseManager: ResponseManager;
	let testResponses: AIMessage[];

	beforeEach(() => {
		testResponses = [
			new AIMessage({ content: 'Response 1' }),
			new AIMessage({ content: 'Response 2' }),
			new AIMessage({ content: 'Response 3' }),
		];
		responseManager = new ResponseManager(testResponses);
	});

	describe('constructor', () => {
		it('should initialize with responses', () => {
			expect(responseManager.getResponseCount()).toBe(3);
			expect(responseManager.hasResponses()).toBe(true);
			expect(responseManager.getCurrentIndex()).toBe(0);
		});

		it('should handle empty responses array', () => {
			const emptyManager = new ResponseManager([]);
			expect(emptyManager.getResponseCount()).toBe(0);
			expect(emptyManager.hasResponses()).toBe(false);
		});
	});

	describe('getNextResponse', () => {
		it('should return responses in sequence', () => {
			const response1 = responseManager.getNextResponse();
			const response2 = responseManager.getNextResponse();
			const response3 = responseManager.getNextResponse();

			expect(response1.content).toBe('Response 1');
			expect(response2.content).toBe('Response 2');
			expect(response3.content).toBe('Response 3');
			expect(responseManager.getCurrentIndex()).toBe(3);
		});

		it('should cycle back to the beginning after all responses are used', () => {
			// Use all responses once
			responseManager.getNextResponse();
			responseManager.getNextResponse();
			responseManager.getNextResponse();

			// Should cycle back to first response
			const response4 = responseManager.getNextResponse();
			expect(response4.content).toBe('Response 1');
			expect(responseManager.getCurrentIndex()).toBe(4);
		});

		it('should handle empty responses gracefully', () => {
			const emptyManager = new ResponseManager([]);
			const response = emptyManager.getNextResponse();

			expect(response.content).toBe('No responses configured');
			expect(emptyManager.getCurrentIndex()).toBe(1);
		});
	});

	describe('reset', () => {
		it('should reset the response index to 0', () => {
			// Use some responses
			responseManager.getNextResponse();
			responseManager.getNextResponse();
			expect(responseManager.getCurrentIndex()).toBe(2);

			// Reset
			responseManager.reset();
			expect(responseManager.getCurrentIndex()).toBe(0);

			// Should start from first response again
			const response = responseManager.getNextResponse();
			expect(response.content).toBe('Response 1');
		});
	});

	describe('getCurrentIndex', () => {
		it('should return the current response index', () => {
			expect(responseManager.getCurrentIndex()).toBe(0);

			responseManager.getNextResponse();
			expect(responseManager.getCurrentIndex()).toBe(1);

			responseManager.getNextResponse();
			expect(responseManager.getCurrentIndex()).toBe(2);
		});
	});

	describe('getResponseCount', () => {
		it('should return the total number of responses', () => {
			expect(responseManager.getResponseCount()).toBe(3);
		});
	});

	describe('hasResponses', () => {
		it('should return true when responses exist', () => {
			expect(responseManager.hasResponses()).toBe(true);
		});

		it('should return false when no responses exist', () => {
			const emptyManager = new ResponseManager([]);
			expect(emptyManager.hasResponses()).toBe(false);
		});
	});
});
