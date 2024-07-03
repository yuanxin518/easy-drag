import { Input, Typography } from "@douyinfe/semi-ui";
import "./index.scss";

const { Text } = Typography;
type PropertyItemParams = { property: [string, string | number | undefined][] };
const PropertyItem = (params: PropertyItemParams) => {
    const buildItems = () => {
        return params.property.map((param) => {
            return (
                <div className="property_item__item" key={param[0]}>
                    <Text strong>{param[0]}</Text>
                    <Input value={param[1]} />
                </div>
            );
        });
    };

    return <div className="property_item__group">{buildItems()}</div>;
};

export default PropertyItem;
