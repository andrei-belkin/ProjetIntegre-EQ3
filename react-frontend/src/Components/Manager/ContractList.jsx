import React, {useEffect, useState} from "react";
import useStyles from "../Utils/useStyles";
import {useApi} from "../Utils/Hooks";
import {Typography} from "@material-ui/core";
import PdfSelectionViewer from "../Utils/PdfSelectionViewer";

export default function ContractList() {
    const classes = useStyles();
    const api = useApi();
    const [contracts, setContracts] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        api.get("/contract")
            .then(r => setContracts(r ? r.data : []))
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    function deleteContract(index) {
        const nextState = [...contracts];
        return api.delete("/contract/" + nextState[index].id)
            .then(() => {
                nextState.splice(index, 1)
                setContracts(nextState)
            })
    }

    return (
        <div style={{height: "100%"}}>
            <PdfSelectionViewer
                documents={contracts ? contracts.map(c => c.file ? "data:application/pdf;base64," + c.file : "") : []}
                title={"Contrats"}>
                {(i, setCurrent) => (
                    <div key={i}>
                        <div className={classes.buttonDiv}>
                            <button
                                type={"button"}
                                className={classes.linkButton}
                                onClick={() => deleteContract(i)}>
                                <i className="fa fa-trash" style={{color: "red"}}/>
                            </button>
                        </div>
                        <button
                            type={"button"}
                            className={[classes.linkButton, i === currentIndex ? classes.fileButton : null].join(' ')}
                            onClick={() => {
                                setCurrent(i);
                                setCurrentIndex(i);
                            }}
                        >
                            <Typography color={"textPrimary"} variant={"body1"}>
                                Nom du gestionnaire de stage : {contracts[i].adminName}
                            </Typography>
                            <hr className={classes.hrStyle}/>
                        </button>
                    </div>
                )}
            </PdfSelectionViewer>
        </div>
    )
}