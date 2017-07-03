//@ts-nocheck

import { generatePOST } from'./index';

describe('Query checks', function() {
	it('should POST correctly', function() {
		expect(generatePOST('board')()).toBeTruthy();
	})
})
