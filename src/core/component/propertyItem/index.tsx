import { Input, Switch, Tag, Typography } from "@douyinfe/semi-ui";
import "./index.scss";

const { Text, Title } = Typography;

type TextType = string | number | undefined;
type InputItem = { type: "input"; property: [string, TextType][] };
type StatusItem = { type: "status"; property: [string, boolean | undefined][] };
type PropertyItemParams = InputItem | StatusItem;
const PropertyItem = (params: PropertyItemParams) => {
    const buildInputItem = (value: string | number | undefined) => {
        return <Input value={value}></Input>;
    };

    const buildStatusItem = (value: boolean) => {
        return <Switch checked={value} />;
    };

    return (
        <div className="property_item__group">
            {params.property.map((param) => {
                return (
                    <div className="property_item__item" key={param[0]}>
                        <Text strong>{param[0]}</Text>
                        {params.type === "input" && buildInputItem(param[1] as TextType)}
                        {params.type === "status" && buildStatusItem(param[1] as boolean)}
                    </div>
                );
            })}
        </div>
    );
};

const PropertyGroup = (props: { children: JSX.Element | JSX.Element[]; title: string }) => {
    const { title, children } = props;
    return (
        <div className="property_group">
            <Tag
                color="cyan"
                size="large"
                style={{
                    marginBottom: 10,
                }}
            >
                {title}
            </Tag>
            {children}
        </div>
    );
};

export { PropertyItem, PropertyGroup };
