/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/* global Range */

import { describe, it, expect } from 'vitest';
import isRange from '../../src/dom/isrange.ts';

describe( 'isRange()', () => {
	it( 'detects native DOM Range', () => {
		expect( isRange( new Range() ) ).to.be.true;

		expect( isRange( {} ) ).to.be.false;
		expect( isRange( null ) ).to.be.false;
		expect( isRange( undefined ) ).to.be.false;
		expect( isRange( new Date() ) ).to.be.false;
		expect( isRange( 42 ) ).to.be.false;
	} );
} );
