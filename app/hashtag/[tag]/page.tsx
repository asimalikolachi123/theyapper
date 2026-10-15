import Platform from "../../Platform";
export default async function Hashtag({params}:{params:{tag:string}}){const {tag}=params;return <Platform page="hashtag" param={decodeURIComponent(tag)}/>;}
