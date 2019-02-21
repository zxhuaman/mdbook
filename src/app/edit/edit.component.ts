import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import * as Editor from 'tui-editor';
import {FileNode} from '../entity/file-node';
import {DataService} from '../data.service';
import {NzDropdownContextComponent, NzDropdownService, NzMessageService, NzModalService, NzTreeComponent} from 'ng-zorro-antd';
import download from '../util';
import {log} from 'util';

export enum OperationType {
  CREATE_FOLDER = 'create_folder',
  CREATE_FILE = 'create_file',
  DOWNLOAD_HTML = 'download_html',
  DOWNLOAD_MARKDOWN = 'download_markdown',
  DELETE_FILE = 'delete_file'
}

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.css']
})
export class EditComponent implements OnInit {
  @ViewChild('treeCom') treeCom: NzTreeComponent;
  private editor;
  isCollapsed = false;
  triggerTemplate = null;
  @ViewChild('trigger') customTrigger: TemplateRef<void>;
  selectedFile: FileNode;
  private dropdown: NzDropdownContextComponent;
  nodes: FileNode[] = [];
  curNode: FileNode;

  constructor(private data: DataService,
              private message: NzMessageService,
              private nzDropdownService: NzDropdownService,
              private nzModalService: NzModalService) {
  }

  ngOnInit() {
    // @ts-ignore
    this.editor = new Editor({
      el: document.querySelector('#edit'),
      initialEditType: 'markdown',
      previewStyle: 'vertical',
      height: `${window.innerHeight - 48}px`,
      width: `${window.innerWidth - 100}px`
    });

    this.editor.addHook('change', () => {
      this.selectedFile.content = this.editor.getMarkdown();
      this.selectedFile = this.selectedFile;
    });

    this.data.fetchTree().subscribe(nodes => this.nodes = nodes);
  }

  save(node: FileNode, notify: boolean = true) {
    node.sha = this.getNode(node.path).sha;
    this.data.updateFile(node.path, node.content, node.sha)
      .subscribe(
        value => {
          this.setNode(value);
          if (notify) {
            this.message.create('success', '保存成功');
          }
        },
        () => {
          if (notify) {
            this.message.create('error', '保存失败');
          }
        });
  }

  contextMenu($event: MouseEvent, template: TemplateRef<void>, node: FileNode): void {
    this.dropdown = this.nzDropdownService.create($event, template);
    this.curNode = node;
  }

  close(type: string) {
    this.dropdown.close();
    switch (type) {
      case OperationType.CREATE_FOLDER:
        break;
      case OperationType.CREATE_FILE:
        this.nzModalService.create({
          nzTitle: '<i>创建文件</i>',
          nzContent: '<b>Some descriptions</b>',
          nzOnOk: () => console.log('create')
        });
        break;
      case OperationType.DELETE_FILE:
        this.nzModalService.create({
          nzTitle: '<i>确定删除文件吗?</i>',
          nzContent: '<b>Some descriptions</b>',
          nzOnOk: () => this.deleteFile(this.curNode)
        });
        break;
      case OperationType.DOWNLOAD_HTML:
        this.downHtml(this.curNode);
        break;
      case OperationType.DOWNLOAD_MARKDOWN:
        this.downMarkdown(this.curNode);
        break;
      default:
        break;
    }
  }

  selectFile(file: FileNode) {
    if (this.selectedFile && this.selectedFile.path === file.path) {
      return;
    }

    if (this.selectedFile) {
      this.save(this.selectedFile, false);
    }
    this.selectedFile = this.getNode(file.path);
    this.data.fetchFile(this.selectedFile.sha).subscribe(content => {
      this.editor.setMarkdown(content);
      this.selectedFile.content = content;
    });
  }

  getNode(path): FileNode {
    const nodes = this.nodes.filter(node => path.includes(node.path));
    for (let i = 0; i < nodes.length; i++) {
      const children = nodes[i].children;
      for (let j = 0; j < children.length; j++) {
        if (children[j].path === path) {
          return children[j];
        }
      }
    }
    return null;
  }

  setNode(file: FileNode) {
    const nodes = this.nodes.filter(node => file.path.includes(node.path));
    for (let i = 0; i < nodes.length; i++) {
      const children = nodes[i].children;
      for (let j = 0; j < children.length; j++) {
        if (children[j].path === file.path) {
          children[j] = file;
        }
      }
    }
  }

  createFolder() {
    // todo
  }

  createFile() {
    // todo
  }

  deleteFile(file: FileNode) {
    this.data.deleteFile(file).subscribe(res => {
      // todo
    });
  }

  downMarkdown(file: FileNode) {
    this.data.fetchFile(file.sha).subscribe(content => {
      download(content, 'text/plain', file.name);
    });
  }

  downHtml(file: FileNode) {
    // todo
  }
}
