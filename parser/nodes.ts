export interface BaseNode<T extends string> {
  type: T;
  location: {
    start: number;
    end: number;
  };
}

export interface HeadlineNode extends BaseNode<"headline"> {
  level: number;
  text: TextNode;
}

export interface ParagraphNode extends BaseNode<"paragraph"> {
  lines: TextNode[];
  isLiteral: boolean;
}

export interface TextNode extends BaseNode<"text"> {
  text: string[];
}

export interface EmptyLineNode extends BaseNode<"emptyLine"> {}

export interface AttributeValueNode extends BaseNode<"attributeValueNode"> {
  values: string[];
}

export interface AttributeNode extends BaseNode<"attributeNode"> {
  key?: string;
  value: AttributeValueNode;
}

export interface AttributeListNode extends BaseNode<"attributeList"> {
  attributes: AttributeNode[];
}

export interface AttributeBlockNode extends BaseNode<"attributeBlock"> {
  list: AttributeListNode;
}

export interface RootNode extends BaseNode<"adoc"> {
  children: AdocNode[];
}

export type AdocNode =
  | RootNode
  | HeadlineNode
  | TextNode
  | EmptyLineNode
  | ParagraphNode
  | AttributeListNode
  | AttributeValueNode
  | AttributeNode
  | AttributeBlockNode;
