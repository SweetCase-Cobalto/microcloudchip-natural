import styled from "styled-components";
import { Image, ProgressBar } from "react-bootstrap";

import { connect } from "react-redux";

const AccountStatus = (props) => {
    let name = props.userName;
    let email = props.email;
    let type = props.isAdmin ? "admin" : "client";
    let capacityStorage = props.maximumVolume;
    let usedStorage = props.usedVolume;
    let usrIcon = props.usrImgLink;

    let gage = (usedStorage / capacityStorage) * 100;

    return (
        <Layout>
            <center style={{ marginBottom: "80px" }} >
                <Image src={usrIcon} width="150px" height="150px" roundedCircle />
                <h3 style={{ marginTop: "20px", fontWeight: "bold", color: "#137813" }}>{name}</h3>
                <p style={{ color: "#707070"}}>{email}</p>
                <p>{type}</p>
            </center>
            <div style={{ fontWeight: "bold" }}>
                <div style={{ marginBottom: "15px" }}>
                    <span style={{color: "#137813" }}>{usedStorage}G</span>
                    <span>/{capacityStorage}G</span>
                </div>
                <ProgressBar style={{ width: "100%", backgroundColor: "#7D7D7D"}} striped variant="success" now={gage} />
            </div>
        </Layout>
    );
}

const mapStateToProps = (state) => {
    return state.ConnectedUserReducer;
}
export default connect(mapStateToProps)(AccountStatus);

const Layout = styled.div`
    line-height: 0.4em;

    font-family: "Gothic A1";
    width: 330px;
    margin-right: 20px;

    box-shadow: 2px 2px 3px gray;

    padding-top: 50px;
    padding-bottom: 100px;
    padding-left: 20px;
    padding-right: 20px;
    
    background-color: #EFEFEF;
`