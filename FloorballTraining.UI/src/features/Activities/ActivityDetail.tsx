import { Paper, Box, TextField, Slider, Button, Typography, Divider, Chip, Autocomplete, Select, MenuItem, InputLabel, FormControl } from "@mui/material";
import Grid from "@mui/material/Grid";

import { useEffect, useState } from "react";
import type { Activity } from "../../app/models/Activity.ts";``
import { useParams, useNavigate } from "react-router-dom";
import DrawingComponent from "../Drawings/DrawingComponent";
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';



export default function ActivityDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [form, setForm] = useState<Activity | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [drawingOpen, setDrawingOpen] = useState(false);
    const [drawingImage, setDrawingImage] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [editSvg, setEditSvg] = useState<string | null>(null);

    const [ageGroups, setAgeGroups] = useState<string[]>([]);
    const [ageGroupsList, setAgeGroupsList] = useState<any[]>([]);
    
    const [tags, setTags] = useState<string[]>([]);
    const [tagsList, setTagsList] = useState<any[]>([]);
    
    const [equipments, setEquipments] = useState<string[]>([]);
    const [equipmentsList, setEquipmentsList] = useState<any[]>([]);
    
    const environments : string[] = ["Indoors", "Outdoors", "Anywhere"];
    
    useEffect(() => {
        setLoading(true);
        Promise.all([
            fetch(`https://localhost:5210/activities/${id}`).then(r => r.json()),
            fetch(`https://localhost:5210/agegroups`).then(r => r.json()),
            fetch(`https://localhost:5210/tags`).then(r => r.json()),
            fetch(`https://localhost:5210/equipments`).then(r => r.json())           
        ])
            .then(([activity, ageGroupsData, tagsData, equipmentsData]) => {
                const transformMedia = (mediaArr: any[]) =>
                    mediaArr.map(m => {
                        let type = m.type || (m.MediaType === 0 ? "image/png" : m.type) || "other";
                        let data = m.data || m.Data || m.Preview || "";
                        let name = m.name || m.Name || "";
                        return { type, data, name };
                    });
                // OPRAVA: nastav transformované obrázky do activity.activityMedium
                activity.activityMedium = transformMedia(activity.activityMedium || []);
                setForm(activity);
                // Robustní získání pole názvů
                const getArray = (data: any) => Array.isArray(data) ? data : (data.items || data.data || []);
                setAgeGroups(getArray(ageGroupsData).map((a: any) => a.name));
                setAgeGroupsList(getArray(ageGroupsData));
                setTags(getArray(tagsData).map((t: any) => t.name));
                setTagsList(getArray(tagsData)); 
                setEquipments(getArray(equipmentsData).map((e: any) => e.name));
                setEquipmentsList(getArray(equipmentsData));

                setLoading(false);
            })
            .catch((e) => {
                setError("Nepodařilo se načíst data." + e.message);
                setLoading(false);
            });
    }, [id]);

    // Handler pro změnu polí
    const handleChange = (field: keyof Activity, value: any) => {
        setForm(prev => prev ? { ...prev, [field]: value } : prev);
    };

    // Handler pro uložení
    const handleSave = async () => {
        if (!form) return;
        setSaving(true);
        setError(null);
        // LOGOVÁNÍ OBSAHU ODESÍLANÉHO POLE OBRÁZKŮ
        console.log('Ukládám activityMedium:', form.activityMedium);
        try {
            const res = await fetch(`https://localhost:5210/activities/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });
            if (!res.ok) throw new Error(`Chyba při ukládání: ${await res.text()}`);

            navigate(-1); // návrat zpět
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    // Otevře modal s DrawingComponent
    const handleOpenDrawing = () => setDrawingOpen(true);
    const handleCloseDrawing = () => setDrawingOpen(false);

    // Otevře modal s DrawingComponent pro editaci existujícího SVG
    const handleEditDrawing = (idx: number, svg: string) => {
        setEditIndex(idx);
        setEditSvg(svg);
        setDrawingOpen(true);
    };

    // Získá SVG z DrawingComponent a uloží do activityMedium jako čistý XML string
    const handleSaveDrawing = async () => {
        const svg = document.querySelector('#svg-canvas') as SVGSVGElement;
        if (!svg) return;
        const serializer = new XMLSerializer();
        let source = serializer.serializeToString(svg);
        setDrawingImage(source); // pro náhled
        if (editIndex !== null) {
            setForm(prev => prev ? {
                ...prev,
                activityMedium: prev.activityMedium.map((m, i) => i === editIndex ? { ...m, data: source } : m)
            } : prev);
        } else {
            setForm(prev => prev ? {
                ...prev,
                activityMedium: [...(prev.activityMedium ?? []), { type: "image/svg+xml", data: source }]
            } : prev);
        }
        setDrawingOpen(false);
        setEditIndex(null);
        setEditSvg(null);
    };

    if (loading) return <Box p={3}>Načítám...</Box>;
    if (error) return <Box p={3} color="error.main">{error}</Box>;
    if (!form) return null;

    return (
        <Box maxWidth={700} mx="auto" mt={4}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h5" mb={2}>Editace aktivity</Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                    <Grid>
                        <TextField label="Název" fullWidth required value={form.name || ""} onChange={e => handleChange("name", e.target.value)} />
                    </Grid>
                    <Grid>
                        <TextField label="Popis" fullWidth multiline minRows={3} value={form.description || ""} onChange={e => handleChange("description", e.target.value)} />
                    </Grid>
                    <Grid>
                        <Typography gutterBottom>Intenzita</Typography>
                        <Slider min={1} max={5} value={form.intensity || 1} onChange={(_, v) => handleChange("intensity", v)} valueLabelDisplay="auto" />
                    </Grid>
                    <Grid>
                        <Typography gutterBottom>Obtížnost</Typography>
                        <Slider min={1} max={5} value={form.difficulty || 1} onChange={(_, v) => handleChange("difficulty", v)} valueLabelDisplay="auto" />
                    </Grid>
                    <Grid>
                        <TextField label="Počet osob min" type="number" fullWidth value={form.personsMin || 1} onChange={e => handleChange("personsMin", Number(e.target.value))} />
                    </Grid>
                    <Grid>
                        <TextField label="Počet osob max" type="number" fullWidth value={form.personsMax || 30} onChange={e => handleChange("personsMax", Number(e.target.value))} />
                    </Grid>
                    <Grid>
                        <TextField label="Brankáři min" type="number" fullWidth value={form.goaliesMin || 0} onChange={e => handleChange("goaliesMin", Number(e.target.value))} />
                    </Grid>
                    <Grid>
                        <TextField label="Brankáři max" type="number" fullWidth value={form.goaliesMax || 0} onChange={e => handleChange("goaliesMax", Number(e.target.value))} />
                    </Grid>
                    <Grid>
                        <TextField label="Doba trvání min (min)" type="number" fullWidth value={form.durationMin || 1} onChange={e => handleChange("durationMin", Number(e.target.value))} />
                    </Grid>
                    <Grid>
                        <TextField label="Doba trvání max (min)" type="number" fullWidth value={form.durationMax || 60} onChange={e => handleChange("durationMax", Number(e.target.value))} />
                    </Grid>
                    <Grid>
                        <FormControl fullWidth>
                            <InputLabel>Prostředí</InputLabel>
                            <Select value={form.environment || "Anywhere"} label="Prostředí" onChange={e => handleChange("environment", e.target.value)}>
                                {environments.map(env => <MenuItem key={env} value={env}>{env}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid>
                        <Autocomplete
                            multiple
                            options={ageGroups}
                            value={form.activityAgeGroups?.map(a => a.ageGroup?.name ?? "") || []}
                            onChange={(_, v) => handleChange("activityAgeGroups", v.map(val => {
                                const obj = ageGroupsList.find(t => t.name === val);
                                return obj ? { ageGroupId: obj.id, ageGroup: obj } : { ageGroup: { name: val } };
                            }))}
                            renderValue={(value, getTagProps) => value.map((option, index) => {
                                const { key, ...chipProps } = getTagProps({ index });
                                return <Chip key={key} label={option} {...chipProps} />;
                            })}
                            renderInput={params => <TextField {...params} label="Věkové kategorie" />}
                        />
                        
                    </Grid>
                    <Autocomplete
                        multiple
                        options={tags}
                        value={form.activityTags?.map(t => t.tag?.name ?? "") || []}
                        onChange={(_, v) => handleChange("activityTags", v.map(val => {
                            const tagObj = tagsList.find(t => t.name === val);
                            return tagObj ? { tagId: tagObj.id, tag: tagObj } : { tag: { name: val } };
                        }))}
                        renderValue={(value, getTagProps) => value.map((option, index) => {
                            const {key, ...chipProps} = getTagProps({index});
                            return <Chip key={key} label={option} {...chipProps} />;
                        })}
                        renderInput={params => <TextField {...params} label="Štítky" />}
                    />
                    <Grid>
                        <Autocomplete 
                            multiple 
                            options={equipments} 
                            value={form.activityEquipments?.map(e => e.equipment?.name ?? "") || []}
                            onChange={(_, v) => handleChange("activityEquipments", v.map(val => {
                                const obj = equipmentsList.find(t => t.name === val);
                                return obj ? { equipmentId: obj.id, equipment: obj } : { equipment: { name: val } };
                            }))}
                            renderValue={(value, getTagProps) => value.map((option, index) => {
                                const {key, ...chipProps} = getTagProps({index});
                                return <Chip key={key} label={option} {...chipProps} />;
                            })}
                            renderInput={params => <TextField {...params} label="Vybavení" />}
                        />
                    </Grid>
                    <Grid>
                        <Typography variant="body2" color="text.secondary">Obrázky a videa lze přidat v detailu aktivity.</Typography>
                        
                        {/* Zobrazení uložených obrázků activityMedium */}
                        {form.activityMedium && form.activityMedium.length > 0 && (
                            <Box mt={2}>
                                <Typography variant="subtitle2">Obrázky uložené k aktivitě:</Typography>
                                <Box display="flex" gap={2} flexWrap="wrap">
                                    {form.activityMedium.map((medium, idx) => (
                                        <div key={idx}>
                                            {(medium.data) ? (
                                                <Box>
                                                    <img
                                                        src={`data:image/svg+xml;utf8,${encodeURIComponent(medium.data)}`}
                                                        alt={`Obrázek ${idx+1}`}
                                                        style={{ maxWidth: 300, border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}
                                                        onClick={() => setPreviewImage(medium.data)}
                                                    />
                                                    <Box display="flex" gap={1} mt={1}>
                                                        <Button size="small" color="primary" onClick={() => handleEditDrawing(idx, medium.data)}>Upravit</Button>
                                                        <Button size="small" color="error" onClick={() => {
                                                            setForm(prev => prev ? { ...prev, activityMedium: prev.activityMedium.filter((_, i) => i !== idx) } : prev);
                                                            if (drawingImage === medium.data) setDrawingImage(null);
                                                        }}>Odstranit</Button>
                                                    </Box>
                                                </Box>
                                            ) : null}
                                        </div>
                                    ))}
                                </Box>
                            </Box>
                        )}
                    </Grid>
                    <Grid>
                        <Button variant="outlined" onClick={handleOpenDrawing}>Přidat obrázek</Button>
                        {/*{drawingImage && (*/}
                        {/*    <Box mt={2}>*/}
                        {/*        <Typography variant="subtitle2">Náhled obrázku:</Typography>*/}
                        {/*        <img src={`data:image/svg+xml;utf8,${encodeURIComponent(drawingImage)}`} alt="Náhled" style={{ maxWidth: 300, border: '1px solid #ccc', borderRadius: 4 }} />*/}
                        {/*        <Button size="small" color="error" onClick={() => { setDrawingImage(null); setForm(prev => prev ? { ...prev, activityMedium: [] } : prev); }}>Odstranit obrázek</Button>*/}
                        {/*    </Box>*/}
                        {/*)}*/}
                    </Grid>
                </Grid>
                <Divider sx={{ my: 2 }} />
                <Box display="flex" gap={2} justifyContent="flex-end">
                    <Button variant="outlined" color="error" onClick={() => navigate(-1)} disabled={saving}>Zrušit</Button>
                    <Button variant="contained" color="primary" onClick={handleSave} disabled={saving}>Uložit</Button>
                </Box>
                {error && <Typography color="error" mt={2}>{error}</Typography>}
            </Paper>
            {/* Dialog pro náhled obrázku */}
            <Dialog open={!!previewImage} onClose={() => setPreviewImage(null)} maxWidth="lg" fullWidth>
                <Box p={2} display="flex" justifyContent="center" alignItems="center">
                    {previewImage && (
                        <img src={`data:image/svg+xml;utf8,${encodeURIComponent(previewImage)}`} alt="Náhled" style={{ maxWidth: '90vw', maxHeight: '80vh', border: '1px solid #ccc', borderRadius: 4 }} />
                    )}
                </Box>
            </Dialog>
            <Dialog open={drawingOpen} onClose={handleCloseDrawing} maxWidth="lg" fullWidth>
                <Box p={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">Kreslení obrázku</Typography>
                        <IconButton onClick={handleCloseDrawing}><CloseIcon /></IconButton>
                    </Box>
                    <DrawingComponent svgXml={editSvg ?? undefined} />
                    <Box mt={2} display="flex" justifyContent="flex-end" gap={2}>
                        <Button variant="outlined" onClick={handleCloseDrawing}>Zrušit</Button>
                        <Button variant="contained" onClick={handleSaveDrawing}>Použít obrázek</Button>
                    </Box>
                </Box>
            </Dialog>
        </Box>
    );
}
