/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module ui/dialog/dialog
 */

import { type Editor, Plugin } from '@ckeditor/ckeditor5-core';
import DialogView, { type DialogViewCloseEvent } from './dialogview';

import '../../theme/components/dialog/dialog.css';
import View from '../view';
import type { DialogActionButtonDefinition } from './dialogactionsview';

/**
 * TODO
 */
export default class Dialog extends Plugin {
	/**
	 * TODO
	 */
	public readonly view: DialogView;

	/**
	 * TODO
	 */
	private _onHide: ( ( dialog: Dialog ) => void ) | undefined;

	/**
	 * @inheritDoc
	 */
	public static get pluginName() {
		return 'Dialog' as const;
	}

	/**
	 * @inheritDoc
	 */
	constructor( editor: Editor ) {
		super( editor );

		this.view = new DialogView( editor.locale );

		this.view.on<DialogViewCloseEvent>( 'close', () => {
			this.hide();
		} );

		editor.ui.view.body.add( this.view );
		editor.ui.focusTracker.add( this.view.element! );
	}

	/**
	 * TODO
	 */
	public show( {
		title,
		content,
		actionButtons,
		className,
		isModal = false,
		onShow,
		onHide
	}: {
		content?: View | Array<View>;
		actionButtons?: Array<DialogActionButtonDefinition>;
		title?: string;
		className?: string;
		isModal?: boolean;
		onShow?: ( dialog: Dialog ) => void;
		onHide?: ( dialog: Dialog ) => void;
	} ): void {
		this.hide();

		this.view.set( {
			isVisible: true,
			className,
			isDraggable: !isModal
		} );

		if ( title ) {
			this.setTitle( title );
		}

		this.view.addContentPart();

		if ( content ) {
			if ( content instanceof View ) {
				content = [ content ];
			}

			this.view.children.addMany( content );
		}

		if ( actionButtons ) {
			this.view.setActionButtons( actionButtons );
		}

		if ( onShow ) {
			onShow( this );
		}

		this.view.focus();

		this._onHide = onHide;
	}

	/**
	 * TODO
	 */
	public hide(): void {
		this.editor.editing.view.focus();

		this.view.isVisible = false;
		this.view.reset();

		if ( this._onHide ) {
			this._onHide( this );
		}
	}

	/**
	 * TODO
	 */
	public setTitle( title: string ): void {
		this.view.showHeader( title );
	}
}