import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {Tool} from './tool';
import {insert, insertText, isFullScreen, toggleFullScreen} from './utils';
import {
  EDIT_TOOL,
  EDIT_TOOLS,
  FULLSCREEN_EXIT_TOOL,
  FULLSCREEN_TOOL,
  Operation,
  PREVIEW_TOOL,
  READ_TOOL,
  THEME_TOOL
} from './edit.operation';
import {MarkdownService} from './markdown.service';
import {trigger, state, style, transition, animate} from '@angular/animations';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('editorAnimation', [
      state('edit', style({
          padding: '.5em 25%'
        }
      )),
      state('read', style({
        display: 'none'
      })),
      transition('edit => preview', [animate('0.3s')]),
      transition('preview => edit', [animate('0.3s')]),
      transition('edit => read', [animate('0s')]),
      transition('read => edit', [animate('0.3s')]),
      transition('preview => read', [animate('0s')]),
      transition('read => preview', [animate('0.3s')]),
    ]),
    trigger('renderAnimation', [
      state('edit', style({
          display: 'none'
        }
      )),
      state('read', style({
        padding: '.5em 25%'
      })),
      transition('edit => preview', [animate('0.3s')]),
      transition('preview => edit', [animate('0.3s')]),
      transition('edit => read', [animate('0.3s')]),
      transition('read => edit', [animate('0.3s')]),
      transition('preview => read', [animate('0.3s')]),
      transition('read => preview', [animate('0.3s')]),
    ]),
  ]
})

export class AppComponent implements OnInit {
  renderHtml = '';
  tools: Array<Tool> = EDIT_TOOLS;
  fullscreenTool: Tool = FULLSCREEN_TOOL;
  modeTool: Tool = PREVIEW_TOOL;
  modes: Tool[] = [PREVIEW_TOOL, READ_TOOL, EDIT_TOOL];
  themeTool: Tool = THEME_TOOL;
  styles: string[];
  currentStyle = 'atom-one-dark';
  isReadMode = false;
  isEditMode = false;

  constructor(private service: MarkdownService) {
    this.styles = this.service.getHighLightStyles();
  }

  ngOnInit(): void {
    this.switchHighLightStyle(this.currentStyle);
  }

  render(text: string) {
    this.renderHtml = this.service.render(text);
  }

  onInput(ev: any) {
    if (ev.inputType !== 'insertCompositionText') {
      this.render(ev.target.value);
    }
  }

  onCompositionend(text: string) {
    this.render(text);
  }

  onClickTool(editor: HTMLTextAreaElement, tool: Tool): void {
    switch (tool.operation) {
      case Operation.PREVIOUS:
        break;
      case Operation.NEXT:
        break;
      case Operation.DELETE:
        editor.value = '';
        editor.focus();
        this.render(editor.value);
        break;
      case Operation.FULLSCREEN:
      case Operation.FULLSCREEN_EXIT:
        toggleFullScreen();
        this.fullscreenTool = isFullScreen() ? FULLSCREEN_TOOL : FULLSCREEN_EXIT_TOOL;
        break;
      case Operation.EDIT:
      case Operation.PREVIEW:
      case Operation.READ:
        this.modeTool = tool;
        this.isReadMode = tool.operation === Operation.READ;
        this.isEditMode = tool.operation === Operation.EDIT;
        break;
      default:
        insertText(editor, tool.prefix, tool.text, tool.suffix);
        this.render(editor.value);
        break;
    }
  }

  onEnter(editor: HTMLTextAreaElement) {
    const textLines = editor.value.substr(0, editor.selectionStart).split('\n');
    const currentLineNumber = textLines.length;
    if (currentLineNumber > 1) {
      const previousLine = editor.value.split('\n')[currentLineNumber - 2];
      let insertion: string;
      if (previousLine.startsWith('- ')) {
        if (previousLine.length > '- '.length) {
          insertion = '- ';
        }
      } else if (/^([0-9]{1,10}\.)/.test(previousLine)) {
        insertion = Number(previousLine.substr(0, previousLine.indexOf('.'))) + 1 + '. ';
      }
      if (insertion) {
        const start = editor.selectionStart;
        insert(editor, start, insertion);
        editor.selectionStart = start + insertion.length;
        editor.selectionEnd = editor.selectionStart;
      }
    }
  }

  switchHighLightStyle(styleName: string) {
    this.currentStyle = styleName;
    this.service.switchHighLightStyle(styleName);
  }
}
