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
});

const ResumePDF = ({ data }) => {
    if (!data) return <Document><Page size="A4" /></Document>;

    const { candidate, education, experience, projects, skills, activities, certifications } = data;

    // Helper to get flat skills array
    let allSkills = [];
    if (skills) {
        if (Array.isArray(skills)) {
            allSkills = skills;
        } else {
            allSkills = [
                ...(skills.technical || []),
                ...(skills.tools || []),
                ...(skills.domain || []),
                ...(skills.soft || [])
            ];
        }
    }

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header Section */}
                <View style={styles.header}>
                    <Text style={styles.name}>{candidate?.name || 'Professional Resume'}</Text>
                    <View style={styles.contactInfo}>
                        {candidate?.email && <Text style={styles.contactItem}>{candidate.email}</Text>}
                        {candidate?.phone && <Text style={styles.contactItem}>{candidate.phone}</Text>}
                        {candidate?.links && candidate.links.map((link, i) => (
                            <Text key={i} style={styles.contactItem}>{link}</Text>
                        ))}
                    </View>
                </View>

                {/* Experience Section */}
                {experience && experience.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Professional Experience</Text>
                        {experience.map((exp, index) => (
                            <View key={index} style={styles.contentBlock}>
                                <View style={styles.row}>
                                    <Text style={styles.title}>{exp.role}</Text>
                                    <Text style={styles.date}>{exp.duration}</Text>
                                </View>
                                <Text style={styles.subtitle}>{exp.company}</Text>
                                {exp.details && exp.details.length > 0 && (
                                    <View style={{ marginTop: 4 }}>
                                        {exp.details.map((bullet, i) => (
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

                {/* Projects Section */}
                {projects && projects.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Projects</Text>
                        {projects.map((proj, index) => (
                            <View key={index} style={styles.contentBlock}>
                                <View style={styles.row}>
                                    <Text style={styles.title}>{proj.title}</Text>
                                </View>
                                {proj.tech && proj.tech.length > 0 && (
                                    <Text style={styles.subtitle}>Technologies: {proj.tech.join(', ')}</Text>
                                )}
                                {proj.description && proj.description.length > 0 && (
                                    <View style={{ marginTop: 4 }}>
                                        {proj.description.map((bullet, i) => (
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
                                    <Text style={styles.title}>{edu.degree} {edu.field ? `in ${edu.field}` : ''}</Text>
                                    <Text style={styles.date}>{[edu.start, edu.end].filter(Boolean).join(' - ')}</Text>
                                </View>
                                <View style={styles.row}>
                                    <Text style={styles.subtitle}>{edu.institution}</Text>
                                    {edu.gpa && <Text style={styles.date}>GPA: {edu.gpa}</Text>}
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Activities Section */}
                {activities && activities.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Leadership & Activities</Text>
                        {activities.map((act, index) => (
                            <View key={index} style={styles.contentBlock}>
                                <View style={styles.row}>
                                    <Text style={styles.title}>{act.role}</Text>
                                    <Text style={styles.date}>{act.duration}</Text>
                                </View>
                                <Text style={styles.subtitle}>{act.organization}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Skills Section */}
                {allSkills && allSkills.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Technical Skills</Text>
                        <View style={styles.skillsContainer}>
                            <Text style={styles.skillItem}>{allSkills.join(' • ')}</Text>
                        </View>
                    </View>
                )}

                {/* Certifications */}
                {certifications && certifications.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Certifications</Text>
                        <View style={styles.skillsContainer}>
                            {certifications.map((cert, index) => (
                                <Text key={index} style={styles.skillItem}>• {cert}</Text>
                            ))}
                        </View>
                    </View>
                )}
            </Page>
        </Document>
    );
};

export default ResumePDF;
