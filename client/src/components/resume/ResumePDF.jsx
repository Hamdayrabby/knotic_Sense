import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Register standard fonts
Font.register({
    family: 'Helvetica',
    fonts: [
        { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyCg4QxlI.ttf' },
    ]
});

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 11,
        color: '#111',
        lineHeight: 1.4,
    },
    header: {
        marginBottom: 20,
        textAlign: 'center',
        borderBottom: '1px solid #333',
        paddingBottom: 10,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    contactInfo: {
        fontSize: 10,
        color: '#444',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        flexWrap: 'wrap',
    },
    contactItem: {
        marginHorizontal: 5,
    },
    section: {
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        borderBottom: '1px solid #ccc',
        paddingBottom: 2,
        marginBottom: 8,
        color: '#222',
    },
    contentBlock: {
        marginBottom: 10,
    },
    row: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
    },
    title: {
        fontWeight: 'bold',
        fontSize: 12,
        color: '#000',
    },
    subtitle: {
        fontStyle: 'italic',
        fontSize: 11,
        color: '#333',
    },
    date: {
        fontSize: 10,
        color: '#555',
    },
    bulletPoint: {
        display: 'flex',
        flexDirection: 'row',
        marginBottom: 3,
    },
    bulletIcon: {
        width: 10,
        fontSize: 10,
    },
    bulletText: {
        flex: 1,
        fontSize: 10,
    },
    skillsContainer: {
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
    },
    skillItem: {
        fontSize: 10,
        marginRight: 6,
        marginBottom: 4,
    },
    summaryText: {
        fontSize: 10,
        textAlign: 'justify',
    }
});

const ResumePDF = ({ data }) => {
    if (!data) return <Document><Page size="A4" /></Document>;

    const { personalInfo, summary, experience, education, skills } = data;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header Section */}
                <View style={styles.header}>
                    <Text style={styles.name}>{personalInfo?.name || 'Professional Resume'}</Text>
                    <View style={styles.contactInfo}>
                        {personalInfo?.email && <Text style={styles.contactItem}>{personalInfo.email}</Text>}
                        {personalInfo?.phone && <Text style={styles.contactItem}>{personalInfo.phone}</Text>}
                        {personalInfo?.location && <Text style={styles.contactItem}>{personalInfo.location}</Text>}
                    </View>
                </View>

                {/* Summary Section */}
                {summary && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Professional Summary</Text>
                        <Text style={styles.summaryText}>{summary}</Text>
                    </View>
                )}

                {/* Experience Section */}
                {experience && experience.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Professional Experience</Text>
                        {experience.map((exp, index) => (
                            <View key={index} style={styles.contentBlock}>
                                <View style={styles.row}>
                                    <Text style={styles.title}>{exp.title}</Text>
                                    <Text style={styles.date}>{exp.dates}</Text>
                                </View>
                                <Text style={styles.subtitle}>{exp.company}</Text>
                                {exp.description && (
                                    <View style={{ marginTop: 4 }}>
                                        {/* Simple bullet splitting by newline or sentences */}
                                        {exp.description.split('\n').filter(b => b.trim()).map((bullet, i) => (
                                            <View key={i} style={styles.bulletPoint}>
                                                <Text style={styles.bulletIcon}>•</Text>
                                                <Text style={styles.bulletText}>{bullet.replace(/^[•\-\*]\s*/, '').trim()}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                )}

                {/* Education Section */}
                {education && education.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Education</Text>
                        {education.map((edu, index) => (
                            <View key={index} style={styles.contentBlock}>
                                <View style={styles.row}>
                                    <Text style={styles.title}>{edu.degree || edu.degreeName}</Text>
                                    <Text style={styles.date}>{edu.year || edu.endDate || edu.dates}</Text>
                                </View>
                                <Text style={styles.subtitle}>{edu.institution || edu.school}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Skills Section */}
                {skills && skills.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Technical Skills</Text>
                        <View style={styles.skillsContainer}>
                            <Text style={styles.skillItem}>{skills.join(' • ')}</Text>
                        </View>
                    </View>
                )}
            </Page>
        </Document>
    );
};

export default ResumePDF;
